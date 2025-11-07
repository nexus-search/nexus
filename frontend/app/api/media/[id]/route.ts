import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // Get auth token - try multiple sources
    // 1. Query parameter (for client-side img tags that can't send headers)
    const { searchParams } = new URL(request.url);
    let token = searchParams.get('token');
    
    // 2. Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        token = authHeader.replace('Bearer ', '');
      }
    }
    
    // 3. Cookie (if using httpOnly cookies in the future)
    if (!token) {
      const cookieStore = await cookies();
      const cookieToken = cookieStore.get('nexus_access_token')?.value;
      if (cookieToken) {
        token = cookieToken;
      }
    }
    
    // Build headers
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Forward any cookies from the request
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    
    // Fetch media from backend
    const response = await fetch(`${API_BASE_URL}/api/v1/media/${id}/file`, {
      headers,
      cache: 'no-store', // Don't cache the proxy request
    });
    
    if (!response.ok) {
      return new NextResponse('Media not found', { status: response.status });
    }
    
    // Get content type
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const blob = await response.blob();
    
    // Return the media with proper headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error proxying media:', error);
    return new NextResponse('Error loading media', { status: 500 });
  }
}

