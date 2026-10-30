
from pathlib import Path
import pandas as pd

# Rutas
raiz = Path(__file__).resolve().parents[2]

ruta_reviews = raiz / "database/data/raw/amazon_reviews_MuMu.json"
ruta_albumes = raiz / "database/data/procesada/albumes.json"
ruta_salida = raiz / "database/data/procesada/reviews.json"

# Leer datasets
df_reviews = pd.read_json(ruta_reviews, lines=True)
df_albumes = pd.read_json(ruta_albumes)

print("--- DATASET ORIGINAL ---")
print("Reseñas:", len(df_reviews))

# 1. Validar campos necesarios
campos_obligatorios = [
    "reviewerID",
    "amazon_id",
    "reviewText",
    "overall"
]

for campo in campos_obligatorios:
    if campo not in df_reviews.columns:
        raise ValueError(f"Falta el campo obligatorio: {campo}")

# 2. Identificar reseñas sin información esencial
sin_id = df_reviews["amazon_id"].isna()

sin_texto = (
    df_reviews["reviewText"].isna()
    | df_reviews["reviewText"].astype("string").str.strip().eq("")
)

sin_puntuacion = df_reviews["overall"].isna()

invalidas = sin_id | sin_texto | sin_puntuacion

print("\n--- VALIDACIONES ---")
print("Sin amazon_id:", sin_id.sum())
print("Sin texto:", sin_texto.sum())
print("Sin puntuación:", sin_puntuacion.sum())

df_reviews = df_reviews.loc[~invalidas].copy()

# 3. Validar puntuaciones
df_reviews["overall"] = pd.to_numeric(
    df_reviews["overall"], errors="coerce"
)

df_reviews = df_reviews.loc[
    df_reviews["overall"].between(1, 5)
].copy()

# 4. Conservar reseñas de álbumes disponibles
ids_albumes = set(
    df_albumes["amazon_id"].dropna().astype(str)
)

df_reviews["amazon_id"] = df_reviews["amazon_id"].astype(str)

sin_album = ~df_reviews["amazon_id"].isin(ids_albumes)

print("Sin álbum asociado al catálogo:", sin_album.sum())

df_reviews = df_reviews.loc[~sin_album].copy()

# 5. Comprobar duplicados exactos
reviews_comparacion = df_reviews.copy()

reviews_comparacion["helpful"] = (
    reviews_comparacion["helpful"].apply(
        lambda x: tuple(x) if isinstance(x, list) else x
    )
)

print(
    "Reseñas duplicadas exactamente:",
    reviews_comparacion.duplicated().sum()
)

# 6. Preparar campos para la selección
df_reviews["votos_utiles"] = (
    df_reviews["helpful"].apply(
        lambda x: x[0] if isinstance(x, list) and len(x) > 0 else 0
    )
)

df_reviews["unixReviewTime"] = pd.to_numeric(
    df_reviews["unixReviewTime"], errors="coerce"
)

# 7. Ordenar y seleccionar máximo 2 reseñas por álbum
df_reviews = df_reviews.sort_values(
    by=["amazon_id", "votos_utiles", "unixReviewTime"],
    ascending=[True, False, False]
)

reviews = df_reviews.groupby(
    "amazon_id",
    sort=False
).head(2).copy()

# 8. Seleccionar campos finales
campos_finales = [
    "reviewerID",
    "reviewerName",
    "amazon_id",
    "reviewText",
    "overall",
    "summary",
    "helpful",
    "unixReviewTime",
    "reviewTime"
]

campos_disponibles = [
    campo for campo in campos_finales
    if campo in reviews.columns
]

reviews = reviews[campos_disponibles].copy()

# 9. Validar cantidad de reseñas por álbum
cantidad_por_album = reviews.groupby("amazon_id").size()

print("\n--- SELECCIÓN FINAL ---")
print("Álbumes con reseñas:", len(cantidad_por_album))
print("Reseñas seleccionadas:", len(reviews))
print("Máximo de reseñas por álbum:", cantidad_por_album.max())
print("Álbumes con una reseña:", (cantidad_por_album == 1).sum())
print("Álbumes con dos reseñas:", (cantidad_por_album == 2).sum())

# 10. Exportar
reviews.to_json(
    ruta_salida,
    orient="records",
    indent=2,
    force_ascii=False
)

print("\nArchivo generado:", ruta_salida)
