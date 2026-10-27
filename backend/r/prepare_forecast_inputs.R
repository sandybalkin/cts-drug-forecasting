#!/usr/bin/env Rscript

# Prepare local forecast inputs for PharmaLaunch.
#
# Replaces the Databricks gold tables:
#   gold_product        -> similarity features
#   gold_bass_features  -> Bass feature rows, plus fitted p and q
#   gold_weekly_rx      -> weekly prescriptions
#
# Inputs are CSVs staged by backend/local_forecast_data.py. That module
# exports DuckDB tables when bootstrap has loaded them, and otherwise
# points at data/*.csv. This script does not open a warehouse and does
# not add products that are not already in those files.
#
# Historical Bass parameters are fit here because bass_final.csv does not
# include p_fit / q_fit. The weekly curve matches
# backend/forecasting/bass.py::bass_weekly_curve, with the same bounds
# the Python trainer used when those columns were missing (p in
# [0.0001, 0.5], q in [0.001, 3], start at 0.03 / 0.3). Failed fits use
# that start point so the downstream Ridge model still has a finite target.
#
# Usage:
#   Rscript backend/r/prepare_forecast_inputs.R \
#     --similarity data/similarity+analog_features_final.csv \
#     --bass data/bass_final.csv \
#     --weekly data/weekly_rx_final.csv \
#     --out /tmp/pharmalaunch-forecast

similarity_columns <- c(
  "product_id",
  "therapeutic_area",
  "indication",
  "active_ingredient",
  "pharmacological_class",
  "mechanism_of_action",
  "route_of_administration",
  "target_population",
  "addressable_population",
  "competition_level",
  "relative_price_index",
  "market_access_level",
  "clinical_evidence_strength"
)

bass_columns <- c(
  "product_id",
  "addressable_population",
  "estimated_penetration",
  "competition_level",
  "market_access_level",
  "relative_price_index",
  "marketing_awareness",
  "launch_strength",
  "physician_awareness",
  "clinical_evidence_strength",
  "treatment_familiarity"
)

weekly_columns <- c(
  "product_id",
  "week_since_launch",
  "weekly_rx",
  "cumulative_rx"
)

similarity_numeric <- c(
  "addressable_population",
  "competition_level",
  "relative_price_index",
  "market_access_level",
  "clinical_evidence_strength"
)

bass_numeric <- c(
  "addressable_population",
  "estimated_penetration",
  "competition_level",
  "market_access_level",
  "relative_price_index",
  "marketing_awareness",
  "launch_strength",
  "physician_awareness",
  "clinical_evidence_strength",
  "treatment_familiarity"
)

parse_args <- function(argv) {
  if (length(argv) == 1 && argv[[1]] %in% c("--help", "-h")) {
    cat(
      "Prepare similarity, Bass, and weekly Rx tables from local CSVs.\n",
      "Required: --similarity --bass --weekly --out\n",
      sep = ""
    )
    quit(status = 0)
  }
  if (length(argv) %% 2 != 0) {
    stop("Arguments must be --key value pairs.")
  }
  out <- list()
  for (i in seq(1, length(argv), by = 2)) {
    key <- argv[[i]]
    if (!startsWith(key, "--")) {
      stop("Unexpected argument: ", key)
    }
    out[[substring(key, 3)]] <- argv[[i + 1]]
  }
  required <- c("similarity", "bass", "weekly", "out")
  missing <- required[!required %in% names(out)]
  if (length(missing) > 0) {
    stop("Missing arguments: ", paste(missing, collapse = ", "))
  }
  out
}

require_columns <- function(df, columns, label) {
  absent <- columns[!columns %in% names(df)]
  if (length(absent) > 0) {
    stop(
      label, " is missing columns: ",
      paste(absent, collapse = ", ")
    )
  }
  df[, columns, drop = FALSE]
}

as_num <- function(x) {
  if (is.numeric(x)) {
    return(as.numeric(x))
  }
  suppressWarnings(as.numeric(trimws(as.character(x))))
}

read_table <- function(path, columns, label) {
  if (!file.exists(path)) {
    stop(label, " file not found: ", path)
  }
  df <- utils::read.csv(
    path,
    stringsAsFactors = FALSE,
    check.names = FALSE,
    na.strings = c("NA", "NaN", "")
  )
  df <- require_columns(df, columns, label)
  df$product_id <- trimws(as.character(df$product_id))
  df <- df[!is.na(df$product_id) & nzchar(df$product_id), , drop = FALSE]
  if (nrow(df) == 0) {
    stop(label, " has no product rows: ", path)
  }
  df
}

# Same discrete Bass adoption increment as bass_weekly_curve().
# t is 1..n in launch order. The observed week numbers are not reused,
# which matches the Python trainer when it fits a product's ordered series.
bass_weekly_rx <- function(p, q, m, n) {
  t <- seq_len(n)
  p <- max(as.numeric(p), 1e-8)
  q <- max(as.numeric(q), 1e-8)
  m <- as.numeric(m)
  adoption <- (1 - exp(-(p + q) * t)) /
    (1 + (q / p) * exp(-(p + q) * t))
  previous <- c(0, adoption[-length(adoption)])
  m * (adoption - previous)
}

fit_product_bass <- function(weekly_rx, m) {
  fallback <- list(p_fit = 0.03, q_fit = 0.3, fit_r2 = NA_real_, fit_ok = 0L)
  y <- as.numeric(weekly_rx)
  if (length(y) < 5 || any(!is.finite(y)) || !is.finite(m) || m <= 0) {
    return(fallback)
  }
  objective <- function(par) {
    pred <- bass_weekly_rx(par[[1]], par[[2]], m, length(y))
    sum((y - pred)^2)
  }
  fit <- tryCatch(
    stats::optim(
      par = c(0.03, 0.3),
      fn = objective,
      method = "L-BFGS-B",
      lower = c(0.0001, 0.001),
      upper = c(0.5, 3.0),
      control = list(maxit = 200)
    ),
    error = function(e) NULL
  )
  if (is.null(fit) || !is.finite(fit$value)) {
    return(fallback)
  }
  pred <- bass_weekly_rx(fit$par[[1]], fit$par[[2]], m, length(y))
  ss_res <- sum((y - pred)^2)
  ss_tot <- sum((y - mean(y))^2)
  r2 <- if (ss_tot > 0) 1 - ss_res / ss_tot else NA_real_
  list(
    p_fit = fit$par[[1]],
    q_fit = fit$par[[2]],
    fit_r2 = r2,
    fit_ok = if (fit$convergence == 0) 1L else 0L
  )
}

prepare_similarity <- function(path) {
  df <- read_table(path, similarity_columns, "similarity")
  for (col in similarity_numeric) {
    df[[col]] <- as_num(df[[col]])
  }
  df <- df[order(df$product_id), , drop = FALSE]
  rownames(df) <- NULL
  df
}

prepare_weekly <- function(path) {
  df <- read_table(path, weekly_columns, "weekly")
  df$week_since_launch <- as_num(df$week_since_launch)
  df$weekly_rx <- as_num(df$weekly_rx)
  df$cumulative_rx <- as_num(df$cumulative_rx)
  df <- df[order(df$product_id, df$week_since_launch), , drop = FALSE]
  # Keep the file's cumulative total when it is present. Fill gaps only.
  missing_cumulative <- !is.finite(df$cumulative_rx)
  if (any(missing_cumulative)) {
    computed <- ave(
      ifelse(is.finite(df$weekly_rx), df$weekly_rx, NA_real_),
      df$product_id,
      FUN = function(x) cumsum(ifelse(is.finite(x), x, 0))
    )
    df$cumulative_rx[missing_cumulative] <- computed[missing_cumulative]
  }
  rownames(df) <- NULL
  df
}

prepare_bass <- function(path, weekly) {
  df <- read_table(path, bass_columns, "bass")
  for (col in bass_numeric) {
    df[[col]] <- as_num(df[[col]])
  }
  # One feature row per product. The CSV is already one row per launch.
  df <- df[!duplicated(df$product_id), , drop = FALSE]
  df$m <- df$addressable_population * df$estimated_penetration

  weekly_by_product <- split(weekly$weekly_rx, weekly$product_id)
  fits <- vector("list", nrow(df))
  for (i in seq_len(nrow(df))) {
    pid <- df$product_id[[i]]
    series <- weekly_by_product[[pid]]
    if (is.null(series)) {
      series <- numeric(0)
    }
    fits[[i]] <- fit_product_bass(series, df$m[[i]])
  }
  fit_df <- do.call(rbind, lapply(fits, as.data.frame))
  df$p_fit <- fit_df$p_fit
  df$q_fit <- fit_df$q_fit
  df$fit_r2 <- fit_df$fit_r2
  df$fit_ok <- fit_df$fit_ok
  df <- df[order(df$product_id), , drop = FALSE]
  rownames(df) <- NULL
  df
}

write_table <- function(df, path) {
  utils::write.csv(df, path, row.names = FALSE, na = "")
}

main <- function() {
  args <- parse_args(commandArgs(trailingOnly = TRUE))
  dir.create(args$out, recursive = TRUE, showWarnings = FALSE)
  old_scipen <- getOption("scipen")
  options(scipen = 999)
  on.exit(options(scipen = old_scipen), add = TRUE)

  similarity <- prepare_similarity(args$similarity)
  weekly <- prepare_weekly(args$weekly)
  bass <- prepare_bass(args$bass, weekly)

  write_table(similarity, file.path(args$out, "similarity.csv"))
  write_table(bass, file.path(args$out, "bass.csv"))
  write_table(weekly, file.path(args$out, "weekly.csv"))

  ok <- sum(bass$fit_ok == 1L, na.rm = TRUE)
  cat(
    "prepared",
    " products=", nrow(similarity),
    " bass_rows=", nrow(bass),
    " weekly_rows=", nrow(weekly),
    " bass_fits_ok=", ok,
    "\n",
    sep = ""
  )
}

main()
