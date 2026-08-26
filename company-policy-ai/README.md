# Company Policy AI Assistant

The **Company Policy AI Assistant** is a production-style, enterprise-grade Retrieval-Augmented Generation (RAG) chatbot platform built with the MERN stack. It enables HR and Admin users to upload company policy PDFs that are automatically extracted, chunked, and stored for use in future AI-powered Q&A.

---

## Tech Stack

- **Frontend**: React (Vite), React Router v6, Tailwind CSS, Axios, Lucide Icons
- **Backend**: Node.js, Express, ES Modules, Mongoose, JWT, bcryptjs, Multer, pdf-parse, dotenv, CORS
- **Database**: MongoDB Atlas

---

## Folder Structure

```
company-policy-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── AdminDocuments.jsx     ← Step 2: PDF management UI
│   │   │   ├── DocumentDetails.jsx    ← Step 2: Chunk preview page
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── documentService.js     ← Step 2: Document API calls
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── documentController.js     ← Step 2: Upload, list, get, delete
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Document.js               ← Step 2: Document schema
│   │   └── Chunk.js                  ← Step 2: Chunk schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── documentRoutes.js         ← Step 2: Document routes
│   ├── services/
│   │   └── chunkService.js           ← Step 2: Sliding window chunker
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## MongoDB Atlas Setup

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new project and provision a free Shared Cluster (M0).
3. Under **Security → Database Access**, create a database user with Read/Write permissions.
4. Under **Security → Network Access**, whitelist your IP (or `0.0.0.0/0` for development).
5. Go to **Database → Clusters**, click **Connect → Drivers → Node.js**, and copy the connection string.

> **Note for Step 2:** No vector index is needed yet. Do NOT create a vector search index — that is Step 3.

---

## Environment Variables

### Backend `backend/.env`

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:5173
```

### Frontend `frontend/.env`

```env
VITE_API_URL=http://localhost:5001/api
```

---

## Installation & Running

### Backend

```bash
cd backend
npm install
npm run dev
```

The server starts on port `5001` with nodemon hot reload.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The client launches at `http://localhost:5173`.

---

## Step 2: PDF Upload & Text Extraction

### How It Works

```
Admin/HR → Upload PDF
             ↓
         Multer (memoryStorage, max 10 MB, PDF only)
             ↓
         pdf-parse → extract text + page count
             ↓
         chunkService → sliding window (600 words, 75 overlap)
             ↓
         MongoDB: documents collection (metadata)
                + chunks collection (text + page range)
```

### Chunking Strategy

The chunking algorithm in `backend/services/chunkService.js`:

1. **Flattens** all per-page text into a word list, tagging each word with its source page number.
2. **Slides** a window of ~600 words across the list with ~75 words of overlap.
3. **Records** `pageStart` and `pageEnd` for each chunk (for future RAG citations).

Example — 2000-word document:
| Chunk | Words | Pages |
|-------|-------|-------|
| 1 | 1–600 | 1–2 |
| 2 | 526–1125 | 2–4 |
| 3 | 1051–1650 | 4–6 |
| 4 | 1576–2000 | 6–8 |

---

## API Endpoints

### Auth

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Protected | Get current user profile |

### Documents (Step 2)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/documents/upload` | admin, hr | Upload PDF, extract + chunk |
| GET | `/api/documents` | All authenticated | List all documents (metadata only) |
| GET | `/api/documents/:id` | All authenticated | Get document + chunk preview |
| DELETE | `/api/documents/:id` | admin, hr | Delete document + all its chunks |

---

## File Validation

- **Allowed type**: `application/pdf` only
- **Max size**: 10 MB
- **Validation**: Both MIME type and file extension are checked
- **Storage**: Memory only (`multer.memoryStorage()`) — files are NOT written to disk

---

## MongoDB Collections

After Step 2, MongoDB contains:

```
company_policy
├── users       ← Step 1
├── documents   ← Step 2 (metadata)
└── chunks      ← Step 2 (extracted text)
```

**documents** example:
```json
{
  "title": "Leave Policy",
  "originalFileName": "leave-policy.pdf",
  "fileSize": 245678,
  "mimeType": "application/pdf",
  "department": "HR",
  "uploadedBy": "ObjectId(...)",
  "totalPages": 10,
  "totalChunks": 25,
  "version": 1,
  "status": "active"
}
```

**chunks** example:
```json
{
  "documentId": "ObjectId(...)",
  "text": "Employees are entitled to 18 paid leaves per calendar year...",
  "pageStart": 3,
  "pageEnd": 4,
  "chunkNumber": 5
}
```

---

## Testing Guide

### Test 1 — Upload a valid PDF (admin/hr)
1. Login as admin or hr user.
2. Navigate to **Dashboard → Manage Documents**.
3. Click **Upload New Policy**.
4. Fill: Title = "Leave Policy", Department = "HR", choose a PDF < 10 MB.
5. Click **Upload Document**.
6. ✅ Success message appears, document appears in table.

### Test 2 — Upload a non-PDF (should fail)
1. In the upload modal, select a `.docx` or `.png` file.
2. ✅ Client rejects it immediately with "Only PDF files are allowed."

### Test 3 — Upload a PDF > 10 MB (should fail)
1. In the upload modal, select a PDF larger than 10 MB.
2. ✅ Error returned: "PDF file must be smaller than 10 MB"

### Test 4 — Employee upload attempt (should return 403)
1. Login as an employee.
2. Manually call: `POST http://localhost:5001/api/documents/upload` with JWT.
3. ✅ Response: `403 Forbidden`

### Test 5 — View chunk details
1. From the Documents table, click **View** on any uploaded document.
2. ✅ Document metadata + chunk previews shown with page ranges.

### Test 6 — Delete a document
1. Click **Delete** on any document.
2. Confirm the dialog.
3. ✅ Document removed from table.
4. ✅ Verify in MongoDB: both the document record and all its chunks are deleted.

### Test 7 — Verify MongoDB directly
Open MongoDB Atlas or Compass:
```
db.documents.find({})
db.chunks.find({ documentId: ObjectId("...") })
```

---

## Authentication Lifecycle

1. **Password Hashing**: Passwords are encrypted before storing using `bcryptjs`.
2. **JWT Issuance**: Signed on login/register with `userId` and `role` claims.
3. **Authorization Interceptor**: Axios client automatically appends `Authorization: Bearer <token>`.
4. **Route Protection**: `ProtectedRoute` component validates token on each navigation.
5. **Role Authorization**: `authorize('admin', 'hr')` middleware restricts upload/delete.

---

## Step Completion Checklist

- [x] **Step 1** — Auth, JWT, roles, protected routes, MongoDB connection
- [x] **Step 2** — PDF upload, text extraction, chunking, MongoDB storage
- [x] **Step 3** — Gemini embeddings for chunks
- [x] **Step 4** — MongoDB Vector Search index + Semantic similarity search
- [x] **Step 5** — RAG chatbot with Gemini LLM
- [ ] **Step 6** — n8n workflow automation

---

## Step 5: Grounded RAG Answer Generation

### What is RAG?
Retrieval-Augmented Generation (RAG) combines search retrieval with generative AI. Instead of asking Gemini to answer questions from memory, we first retrieve relevant company policy chunks from MongoDB Vector Search, inject those chunks into the prompt as reference context, and instruct Gemini to answer strictly using that context.

### RAG Pipeline Flow
1. **User Question**: User submits a policy query (e.g., *"How many annual leave days do employees get?"*).
2. **Query Embedding**: Gemini converts the query into a 1536-dimensional vector using `gemini-embedding-2-preview`.
3. **Vector Search**: MongoDB Atlas Vector Search searches the `chunks` collection using cosine similarity.
4. **Relevance Threshold Filtering**: Chunks with similarity score `< 0.70` (configurable via `RAG_MIN_SCORE`) are filtered out.
5. **Context Construction**: High-relevance chunks are formatted into a clean context block with document titles and page numbers.
6. **Gemini Answer Generation**: `gemini-2.5-flash` synthesizes a concise, grounded answer based strictly on the context.
7. **Source Citations**: The backend returns the generated answer alongside source document titles, pages, and relevance scores.

### Preventing Hallucination
- If no chunks pass the relevance threshold (`0.70`), Gemini is NOT called. The API immediately returns:
  `"I couldn't find this information in the available company policies."`
- The system instructions explicitly instruct Gemini to restrict answers to the provided context, avoid using outside knowledge, and ignore prompt injection attempts contained within untrusted reference material.

### API Endpoint
- `POST /api/rag/ask`
- Request: `{ "question": "How many annual leaves do employees get?" }`
- Response: `{ "success": true, "data": { "question": "...", "answer": "...", "sources": [...] } }`

---

## Step 3: Gemini Embeddings

### What is an Embedding?
An embedding is a representation of text as a dense vector (an array of numbers). Semantically similar texts are mapped to vectors that are close to each other in this multidimensional space.

### Why each chunk gets an embedding?
Instead of representing an entire 50-page PDF as a single vector (which loses all specific detail), we represent each ~600-word chunk as its own vector. When a user asks a question, we embed their question and find the chunks that have the most similar vectors. This allows us to retrieve exact passages from the PDF.

### What does Gemini Embedding Model do?
We use `gemini-embedding-2-preview` from Google's `@google/genai` SDK. It converts any given chunk of text into a fixed-size vector.

### What does 1536 dimensions mean?
The vector contains exactly 1536 floating-point numbers. We explicitly configure this dimensionality (`outputDimensionality: 1536`) to ensure consistency. Every vector stored in our database *must* have the exact same dimension, otherwise mathematical comparison (cosine similarity) is impossible.

### Where is the embedding stored?
The 1536-dimensional array is stored directly in the `chunks` collection in MongoDB alongside the raw text.

### What happens if embedding generation fails?
If generating embeddings for a document fails (e.g. rate limit, network error), the document status is updated to `failed` and the error is stored in `processingError`. You can manually retry embedding generation via the `[ Embed ]` button in the UI.

---

## Step 4: MongoDB Atlas Vector Search

### What is a Vector Search Index?
A vector search index is a specialized database structure that allows MongoDB to rapidly calculate the mathematical distance between vectors. Without it, MongoDB would have to compare your query vector against every single chunk sequentially, which is incredibly slow. The index organizes vectors so it can quickly narrow down the nearest neighbors.

### Why not use traditional text search?
Traditional keyword search (e.g., `$text`) relies on exact word overlap. If you search for "paid leaves", it finds documents containing those exact words. If a document instead says "annual time off", keyword search fails. Semantic Vector Search, however, understands meaning. It maps both "paid leaves" and "annual time off" to vectors that point in the same direction, allowing you to find the right passage even if the exact words differ.

### Setting up the Vector Search Index in MongoDB Atlas

You **must** create the Vector Search index manually in the Atlas UI before the Semantic Search Test page will work.

1. Open **MongoDB Atlas** and navigate to your cluster.
2. Click on **Browse Collections**.
3. Open the `company_policy` database and select the `chunks` collection.
4. Go to the **Atlas Search** tab (or **Search** -> **Vector Search**).
5. Click **Create Search Index**.
6. Select **Atlas Vector Search** and use the **JSON Editor**.
7. Ensure the **Database** is `company_policy` and **Collection** is `chunks`.
8. Enter `vector_index` as the **Index Name**.
9. Paste the following JSON configuration:
   ```json
   {
     "fields": [
       {
         "type": "vector",
         "path": "embedding",
         "numDimensions": 1536,
         "similarity": "cosine"
       }
     ]
   }
   ```
10. Click **Next** and **Create Search Index**.
11. Wait for the index status to become **Ready** (this may take a minute).

### Atlas Index Configuration Fields Explained
- **`type: "vector"`**: Tells MongoDB this is a vector index, not a standard text index.
- **`path: "embedding"`**: Tells MongoDB to look inside each chunk's `embedding` field.
- **`numDimensions: 1536`**: The exact length of the arrays. Our Gemini embeddings are 1536 numbers long.
- **`similarity: "cosine"`**: Tells MongoDB to use Cosine Similarity (the angle between vectors) to determine how similar two vectors are.
