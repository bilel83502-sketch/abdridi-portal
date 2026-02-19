export { default } from 'next-auth/middleware';
export const config = { matcher: ['/dashboard/:path*', '/marches/:path*', '/alertes/:path*', '/parametres/:path*'] };
