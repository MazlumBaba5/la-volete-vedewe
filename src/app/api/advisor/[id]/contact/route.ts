import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/advisor/[id]/contact
 * Fetch advisor contact information after explicit user action.
 * The public page keeps the number masked; the API reveals it only after the visitor clicks "show".
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const admin = createAdminClient()

    // Fetch advisor phone after the user explicitly clicked "show".
    const { data, error } = await admin
      .from('advisors')
      .select('id, phone, whatsapp_available')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Advisor not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching contact info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
