
from pathlib import Path
import pandas as pd

# Rutas
raiz = Path(__file__).resolve().parents[2]

ruta_generos = raiz / "database/data/raw/MuMu_dataset_multi-label.csv"
ruta_metadata = raiz / "database/data/raw/amazon_metadata_MuMu.json"
ruta_salida = raiz / "database/data/procesada/albumes.json"

# Leer datasets
df_generos = pd.read_csv(ruta_generos, dtype="string")
df_metadata = pd.read_json(ruta_metadata)

print("--- DATASETS ORIGINALES ---")
print("Registros metadata:", len(df_metadata))
print("Registros multi-label:", len(df_generos))

# 1. Validar campos necesarios
campos_metadata = [
    "amazon_id",
    "title",
    "imUrl",
    "artist",
    "artist_mbid"
]

campos_generos = [
    "amazon_id",
    "artist_mbid",
    "genres"
]

for campo in campos_metadata:
    if campo not in df_metadata.columns:
        raise ValueError(f"Falta el campo en metadata: {campo}")

for campo in campos_generos:
    if campo not in df_generos.columns:
        raise ValueError(f"Falta el campo en multi-label: {campo}")

# 2. Normalizar identificadores
df_metadata["amazon_id"] = df_metadata["amazon_id"].astype("string").str.strip()
df_generos["amazon_id"] = df_generos["amazon_id"].astype("string").str.strip()

# 3. Comprobar identificadores duplicados en metadata
duplicados = df_metadata["amazon_id"].duplicated().sum()

if duplicados > 0:
    raise ValueError(
        f"Metadata contiene {duplicados} amazon_id duplicados."
    )

# 4. Agrupar géneros por álbum
generos_por_album = (
    df_generos.dropna(subset=["amazon_id", "genres"])
    .groupby("amazon_id")["genres"]
    .apply(
        lambda filas: list(dict.fromkeys(
            genero.strip()
            for fila in filas
            for genero in fila.split(",")
            if genero.strip()
        ))
    )
    .reset_index(name="generos")
)

# 5. Obtener y validar el identificador del artista
artistas_por_album = (
    df_generos.dropna(subset=["amazon_id", "artist_mbid"])
    .groupby("amazon_id")["artist_mbid"]
    .nunique()
)

inconsistencias = artistas_por_album[artistas_por_album > 1]

if not inconsistencias.empty:
    raise ValueError(
        "Hay álbumes asociados a más de un artist_mbid en el CSV. "
        f"Ejemplos: {inconsistencias.head().index.tolist()}"
    )

# 6. Unir metadata con géneros
albumes = df_metadata.merge(
    generos_por_album,
    on="amazon_id",
    how="inner",
    validate="one_to_one"
)

# 7. Crear documentos con la estructura de MongoDB
albumes = albumes.rename(
    columns={
        "amazon_id": "_id",
        "title": "titulo",
        "imUrl": "img_url"
    }
)

albumes["artista"] = albumes.apply(
    lambda fila: {
        "nombre": fila["artist"],
        "mbid": fila["artist_mbid"]
    },
    axis=1
)

# 8. Eliminar álbumes sin título
sin_titulo = (
    albumes["titulo"].isna()
    | albumes["titulo"].astype("string").str.strip().eq("")
    | albumes["titulo"].astype("string").str.strip().str.lower().isin(
        ["unknown", "n/a"]
    )
)

print("\nÁlbumes sin título:", sin_titulo.sum())

albumes = albumes.loc[~sin_titulo].copy()

# 9. Conservar únicamente los campos del modelo documental
albumes = albumes[
    ["_id", "titulo", "img_url", "artista", "generos"]
].copy()

# 10. Validaciones finales
if albumes["_id"].duplicated().any():
    raise ValueError("Hay _id duplicados en el catálogo.")

print("\n--- RESULTADO FINAL ---")
print("Álbumes generados:", len(albumes))
print("Identificadores duplicados:", albumes["_id"].duplicated().sum())
print("Títulos nulos:", albumes["titulo"].isna().sum())
print("Imágenes nulas:", albumes["img_url"].isna().sum())
print("Artistas nulos:", albumes["artista"].isna().sum())
print("Álbumes sin géneros:", albumes["generos"].apply(len).eq(0).sum())

# 11. Exportar
ruta_salida.parent.mkdir(parents=True, exist_ok=True)

albumes.to_json(
    ruta_salida,
    orient="records",
    indent=2,
    force_ascii=False
)

print("\nArchivo generado:", ruta_salida)
print("Campos:", albumes.columns.tolist())
