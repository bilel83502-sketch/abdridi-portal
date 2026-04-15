import { prisma } from '@/lib/prisma';

export async function startCronLog(jobName: string): Promise<{ id: string; startedAt: Date }> {
  const startedAt = new Date();
  const log = await prisma.cronLog.create({
    data: {
      jobName,
      success: true, // will be updated at finish
      message: 'RUNNING',
    },
  });
  return { id: log.id, startedAt };
}

export async function finishCronLog(
  id: string,
  success: boolean,
  summary?: Record<string, any>,
  error?: string
): Promise<void> {
  const log = await prisma.cronLog.findUnique({ where: { id } });
  const duration = log ? Date.now() - new Date(log.executedAt).getTime() : 0;

  await prisma.cronLog.update({
    where: { id },
    data: {
      success,
      message: success
        ? JSON.stringify({ status: 'SUCCESS', durationMs: duration, ...summary })
        : JSON.stringify({ status: 'FAILED', durationMs: duration, error }),
    },
  });
}

export async function withCronLogging(
  jobName: string,
  handler: () => Promise<Record<string, any>>
): Promise<{ summary: Record<string, any>; logId: string }> {
  const { id, startedAt } = await startCronLog(jobName);
  try {
    const summary = await handler();
    await finishCronLog(id, true, summary);
    return { summary, logId: id };
  } catch (error: any) {
    await finishCronLog(id, false, undefined, error?.message || 'Unknown error');
    throw error;
  }
}
