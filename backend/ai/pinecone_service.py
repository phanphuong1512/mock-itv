# -*- coding: utf-8 -*-
"""Pinecone VectorDB service for Custom Mock RAG."""

import os
from pinecone import Pinecone
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Load environment
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "mockitv")

# Initialize Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)

# Use provided EMBEDDING_API_KEY for text-embedding-3-large
OPENAI_ENDPOINT = os.getenv("OPENAI_ENDPOINT")
EMBEDDING_API_KEY = os.getenv("EMBEDDING_API_KEY")

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
    openai_api_key=EMBEDDING_API_KEY,
    openai_api_base=OPENAI_ENDPOINT,
    dimensions=3072,
)

def get_vectorstore(namespace: str) -> PineconeVectorStore:
    """Get Pinecone vector store for a specific namespace."""
    index = pc.Index(PINECONE_INDEX_NAME)
    return PineconeVectorStore(
        index=index,
        embedding=embeddings,
        namespace=namespace,
        text_key="text"
    )

def index_document(text: str, namespace: str):
    """Chunk and index document into Pinecone."""
    if not text.strip():
        return
        
    # Split text into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        separators=["\n\n", "\n", " ", ""]
    )
    docs = text_splitter.create_documents([text])
    
    # Store in Pinecone
    vectorstore = get_vectorstore(namespace)
    vectorstore.add_documents(docs)

def get_retriever(namespace: str, k: int = 4):
    """Get a retriever for a specific namespace."""
    vectorstore = get_vectorstore(namespace)
    return vectorstore.as_retriever(search_kwargs={"k": k})
