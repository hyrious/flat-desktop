export function renderTime(totalSeconds: number): string {
    const seconds = totalSeconds % 60;
    let totalMinutes = (totalSeconds - seconds) / 60;

    if (totalMinutes >= 60) {
        const minutes = totalMinutes % 60;
        const hours = (totalMinutes - minutes) / 60;
        return `${format(hours)} : ${format(minutes)} : ${format(seconds)}`;
    } else {
        return `${format(totalMinutes)} : ${format(seconds)}`;
    }
}

function format(n: number): string {
    return String(n).padStart(2, "0");
}
