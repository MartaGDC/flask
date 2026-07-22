library(jsonlite)
library(GLCMTextures) #requiere instalacion rspatial/terra

args <- commandArgs(trailingOnly = TRUE)
params <- fromJSON(args[1])

originalNb <- params$originalNb
maskNb <- params$maskNb
img_roi <- params$img_roi
mask_roi <- params$mask_roi

mask_roi <- as.logical(mask_roi)
img_roi[!mask_roi] <- NA

img_raster <- terra::rast(img_roi)
img_roi32  <- quantize_raster(
    img_raster,
    n_levels = 32,
    quant_method = "prob"
)

#---------GLCM---------
glcm <- make_glcm(
    x = img_roi32,
    n_levels = 32,
    shift = c(1, 0),
    na.rm = TRUE,
    normalize = TRUE
)
metrics <- glcm_metrics(glcm)

#---------GLDSM--------- Comparación con pixeles en 4 direcciones
calc_glds_metrics <- function(img, dx, dy) {
    nr <- nrow(img)
    nc <- ncol(img)
    #imagen:
    r1 <- max(1, 1 - dy):min(nr, nr - dy)
    c1 <- max(1, 1 - dx):min(nc, nc - dx)
    #imagen desplazada:
    r2 <- r1 + dy
    c2 <- c1 + dx

    img1 <- img[r1, c1]
    img2 <- img[r2, c2]
    valid <- !is.na(img1) & !is.na(img2)
    
    dif <- abs(img1[valid] - img2[valid])
    counts <- table(factor(dif, levels = 0:31))
    p <- as.numeric(counts) / sum(counts)
    n_indices <- 0:31
    c(
        glds_homogeneity = sum(p / (1 + n_indices^2)),
        glds_contrast    = sum(n_indices^2 * p),
        glds_asm         = sum(p^2),
        glds_entropy     = -sum(p[p > 0] * log2(p[p > 0])),
        glds_mean        = sum(n_indices * p)
    )
}
dirs <- list(c(0, 1), c(1, 1), c(1, 0), c(1, -1)) #desplazamiento pixeles en 4 direcciones

results <- lapply(dirs, function(d)
    calc_glds_metrics(img_roi32, d[1], d[2])
)
glds_metrics <- Reduce("+", results) / length(results) #medias


cat(toJSON(c(
    list(
        frameoriginal = originalNb,
        frameMask = maskNb
    ),
    as.list(metrics),
    as.list(glds_metrics)),
    auto_unbox = TRUE
))
