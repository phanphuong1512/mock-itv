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

def get_embeddings() -> OpenAIEmbeddings:
    from dotenv import load_dotenv
    load_dotenv(override=True)
    return OpenAIEmbeddings(
        model="text-embedding-3-large",
        openai_api_key=os.getenv("EMBEDDING_API_KEY"),
        openai_api_base=os.getenv("OPENAI_ENDPOINT"),
        dimensions=3072,
    )

def get_vectorstore(namespace: str) -> PineconeVectorStore:
    """Get Pinecone vector store for a specific namespace."""
    from dotenv import load_dotenv
    load_dotenv(override=True)
    pinecone_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX_NAME", "mockitv")
    client = Pinecone(api_key=pinecone_key)
    index = client.Index(index_name)
    return PineconeVectorStore(
        index=index,
        embedding=get_embeddings(),
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
