export function formatUptime(uptime: number): string {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor(uptime / 3600) % 24;
  const minutes = Math.floor(uptime / 60) % 60;
  return `${days}d ${hours}h ${minutes}m`;
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function parseTime(timeString: string): Date|undefined {
  try {
    // parse time string
    const [datePart, timePart] = timeString.split(":");
    const [year, month, day] = datePart.split("/");
    
    // check all parts are present
    if (!year || !month || !day || !timePart) {
      console.error("Invalid date format");
      return undefined
    }

    return new Date(
      parseInt(year) + 2000,
      parseInt(month) - 1,
      parseInt(day),
      parseInt(timePart),
      0,
    );
  } catch (e) {
    console.error("Invalid date format");
    return undefined;
  }
}
