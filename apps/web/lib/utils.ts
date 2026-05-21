"use server";

import { cookies } from 'next/headers'
 
export async function getToken () {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-canavas-sketch-board-token')?.value;
  return token;
}