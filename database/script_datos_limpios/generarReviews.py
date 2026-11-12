
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
    "amazon_id",
    "reviewerName",
    "reviewText",
    "overall",
    "unixReviewTime"
]

for campo in campos_obligatorios:
    if campo not in df_reviews.columns:
        raise ValueError(f"Falta el campo obligatorio: {campo}")

if "_id" not in df_albumes.columns:
    raise ValueError("El catálogo no contiene el campo _id.")

# 2. Eliminar reseñas sin información esencial
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
    df_reviews["overall"],
    errors="coerce"
)

df_reviews = df_reviews.loc[
    df_reviews["overall"].between(1, 5)
].copy()

# 4. Conservar reseñas de álbumes del catálogo
ids_albumes = set(
    df_albumes["_id"].dropna().astype(str)
)

df_reviews["amazon_id"] = (
    df_reviews["amazon_id"].astype(str).str.strip()
)

sin_album = ~df_reviews["amazon_id"].isin(ids_albumes)

print("Sin álbum asociado al catálogo:", sin_album.sum())

df_reviews = df_reviews.loc[~sin_album].copy()

# 5. Comprobar duplicados exactos
reviews_comparacion = df_reviews.copy()

if "helpful" in reviews_comparacion.columns:
    reviews_comparacion["helpful"] = (
        reviews_comparacion["helpful"].apply(
            lambda x: tuple(x) if isinstance(x, list) else x
        )
    )

duplicados = reviews_comparacion.duplicated().sum()

print("Reseñas duplicadas exactamente:", duplicados)

# 6. Preparar criterios de selección
if "helpful" in df_reviews.columns:
    df_reviews["votos_utiles"] = (
        df_reviews["helpful"].apply(
            lambda x: x[0]
            if isinstance(x, list) and len(x) > 0
            else 0
        )
    )
else:
    df_reviews["votos_utiles"] = 0

df_reviews["unixReviewTime"] = pd.to_numeric(
    df_reviews["unixReviewTime"],
    errors="coerce"
)

# 7. Ordenar por álbum, votos útiles y fecha
df_reviews = df_reviews.sort_values(
    by=["amazon_id", "votos_utiles", "unixReviewTime"],
    ascending=[True, False, False]
)

# 8. Seleccionar máximo dos reseñas por álbum
reviews = (
    df_reviews.groupby("amazon_id", sort=False)
    .head(2)
    .copy()
)

# 9. Convertir fecha Unix a AAAA-MM-DD
reviews["fecha"] = (
    pd.to_datetime(
        reviews["unixReviewTime"],
        unit="s",
        utc=True,
        errors="coerce"
    )
    .dt.strftime("%Y-%m-%d")
)

# 10. Adaptar nombres al modelo MongoDB
reviews = reviews.rename(
    columns={
        "amazon_id": "album_id",
        "reviewerName": "reviewer_name",
        "overall": "puntaje",
        "summary": "titulo",
        "reviewText": "texto"
    }
)

# 11. Conservar únicamente los campos del modelo
reviews = reviews[
    [
        "album_id",
        "reviewer_name",
        "puntaje",
        "titulo",
        "texto",
        "fecha"
    ]
].copy()

# 12. Estadísticas de selección
cantidad_por_album = reviews.groupby("album_id").size()

print("\n--- SELECCIÓN FINAL ---")
print("Álbumes con reseñas:", len(cantidad_por_album))
print("Reseñas seleccionadas:", len(reviews))
print("Máximo de reseñas por álbum:", cantidad_por_album.max())
print("Álbumes con una reseña:", (cantidad_por_album == 1).sum())
print("Álbumes con dos reseñas:", (cantidad_por_album == 2).sum())

# 13. Validaciones finales
print("\n--- CALIDAD DE LOS DATOS ---")
print(
    "Puntajes fuera de rango:",
    (~reviews["puntaje"].between(1, 5)).sum()
)

print("Fechas faltantes:", reviews["fecha"].isna().sum())

print(
    "Referencias a álbumes inexistentes:",
    (~reviews["album_id"].isin(ids_albumes)).sum()
)

# 14. Exportar
ruta_salida.parent.mkdir(parents=True, exist_ok=True)

reviews.to_json(
    ruta_salida,
    orient="records",
    indent=2,
    force_ascii=False
)

print("\n--- RESULTADO FINAL ---")
print("Reseñas conservadas:", len(reviews))
print("Archivo generado:", ruta_salida)
print("Campos:", reviews.columns.tolist())

# MongoDB generará automáticamente el campo _id
# cuando se importen los documentos.
