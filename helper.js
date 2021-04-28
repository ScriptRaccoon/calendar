export function dateString(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

export function getDayIndex(date) {
    const falseIndex = date.getDay();
    return falseIndex == 0 ? 6 : falseIndex - 1;
}

const dayInMillis = 1000 * 60 * 60 * 24;

export function addDays(date, number) {
    return new Date(date.getTime() + number * dayInMillis);
}

export function generateId(length = 20) {
    const chars = "ABCDEFGHIHJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < length; i++) {
        const rand = Math.floor(Math.random() * chars.length);
        id += chars.charAt(rand);
    }
    return id;
}
