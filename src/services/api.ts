import { Book, ReadingList, Recommendation, Review } from '@/types';
import { fetchAuthSession } from "aws-amplify/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log('API_BASE_URL:', API_BASE_URL);

/**
 * ============================================================================
 * API SERVICE LAYER - BACKEND COMMUNICATION
 * ============================================================================
 *
 * ⚠️ IMPORTANT: This file currently uses MOCK DATA for all API calls.
 *
 * TO IMPLEMENT AWS BACKEND:
 * Follow the step-by-step guide in IMPLEMENTATION_GUIDE.md
 *
 * Quick Reference:
 * - Week 2: Implement Books API (getBooks, getBook, createBook, etc.)
 * - Week 2: Implement Reading Lists API
 * - Week 3: Add Cognito authentication headers
 * - Week 4: Implement AI recommendations with Bedrock
 *
 * ============================================================================
 * IMPLEMENTATION CHECKLIST:
 * ============================================================================
 *
 * [ ] Week 1: Set up AWS account and first Lambda function
 * [ ] Week 2: Create DynamoDB tables (Books, ReadingLists)
 * [ ] Week 2: Deploy Lambda functions for Books API
 * [ ] Week 2: Deploy Lambda functions for Reading Lists API
 * [ ] Week 2: Set VITE_API_BASE_URL in .env file
 * [ ] Week 3: Set up Cognito User Pool
 * [ ] Week 3: Install aws-amplify: npm install aws-amplify
 * [ ] Week 3: Configure Amplify in src/main.tsx
 * [ ] Week 3: Update AuthContext with Cognito functions
 * [ ] Week 3: Implement getAuthHeaders() function below
 * [ ] Week 3: Add Cognito authorizer to API Gateway
 * [ ] Week 4: Deploy Bedrock recommendations Lambda
 * [ ] Week 4: Update getRecommendations() function
 * [ ] Week 4: Remove all mock data returns
 * [ ] Week 4: Delete src/services/mockData.ts
 *
 * ============================================================================
 */

/**
 * Internal helper to get Authorization header from Cognito
 */
async function getAuthHeaders() {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();

  if (!token) {
    throw new Error("No auth token found");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Get all books from the catalog
 */
export async function getBooks(): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/books`);
  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }
  return response.json();
}

/**
 * Get a single book by ID
 */
export async function getBook(id: string): Promise<Book | null> {
  const response = await fetch(`${API_BASE_URL}/books/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error('Failed to fetch book');
  }
  return response.json();
}

/**
 * Create a new book (admin only)
 */
export async function createBook(book: Omit<Book, 'id'>): Promise<Book> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newBook: Book = {
        ...book,
        id: Date.now().toString(),
      };
      resolve(newBook);
    }, 500);
  });
}

export async function updateBook(id: string, book: Partial<Book>): Promise<Book> {
  const response = await fetch(`${API_BASE_URL}/books/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(book),
  });

  if (!response.ok) {
    throw new Error('Failed to update book');
  }

  return response.json();
}

/**
 * Delete a book (admin only)
 */
export async function deleteBook(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 300);
  });
}

/**
 * Get AI-powered book recommendations using Amazon Bedrock
 */
export async function getRecommendations(
  query: string
): Promise<{ recommendations: string }> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/recommendations`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch recommendations");
  }

  return response.json();
}

/**
 * Get user's reading lists
 */
export async function getReadingLists(): Promise<ReadingList[]> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/reading-lists`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch reading lists");
  }

  return response.json();
}

/**
 * Create a new reading list
 */
export async function createReadingList(
  list: Omit<ReadingList, "id" | "createdAt" | "updatedAt">
): Promise<ReadingList> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/reading-lists`, {
    method: "POST",
    headers,
    body: JSON.stringify(list),
  });

  if (!response.ok) {
    throw new Error("Failed to create reading list");
  }

  return response.json();
}

/**
 * Update a reading list
 */
export async function updateReadingList(
  id: string,
  list: Partial<ReadingList>
): Promise<ReadingList> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/reading-lists/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(list),
  });

  if (!response.ok) {
    throw new Error("Failed to update reading list");
  }

  return response.json();
}

/**
 * Delete a reading list
 */
export async function deleteReadingList(id: string): Promise<void> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/reading-lists/${id}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to delete reading list");
  }
}

/**
 * Get reviews for a book
 */
export async function getReviews(bookId: string): Promise<Review[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockReviews: Review[] = [
        {
          id: '1',
          bookId,
          userId: '1',
          rating: 5,
          comment: 'Absolutely loved this book! A must-read.',
          createdAt: '2024-11-01T10:00:00Z',
        },
      ];
      resolve(mockReviews);
    }, 500);
  });
}

/**
 * Create a new review
 */
export async function createReview(
  review: Omit<Review, 'id' | 'createdAt'>
): Promise<Review> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newReview: Review = {
        ...review,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      resolve(newReview);
    }, 500);
  });
}
