export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startMatchmakerWorker } = await import('@/lib/matchmaker');
    startMatchmakerWorker();
  }
}
