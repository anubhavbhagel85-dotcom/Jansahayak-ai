import pandas as pd
import chromadb
import os
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')
client = chromadb.Client()
collection = None

def load_schemes():
    global collection
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(BASE_DIR, 'schemes_data.csv')
    df = pd.read_csv(csv_path)
    collection = client.get_or_create_collection('schemes')
    for _, row in df.iterrows():
        text = f"{row['scheme_name']} {row['category']} {row['benefits']}"
        emb = model.encode(text).tolist()
        collection.add(
            embeddings=[emb],
            documents=[text],
            metadatas=[row.fillna('').to_dict()],
            ids=[f'scheme_{row.name}']
        )
    print(f'Loaded {len(df)} schemes into ChromaDB')

def query_schemes(query: str, n_results: int = 5):
    if collection is None:
        load_schemes()
    emb = model.encode(query).tolist()
    results = collection.query(query_embeddings=[emb], n_results=n_results)
    return results['metadatas'][0]
