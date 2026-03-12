const days = [
  "01", "02", "03", "04", "05", "06", "07",
  "08", "09", "10", "11", "12", "13", "14",
  "15", "16", "17", "18", "19", "20", "21",
  "22", "23", "24", "25", "26", "27", "28"
];

const tones = ["bg-success/15 border-success/30", "bg-warning/15 border-warning/30", "bg-background/60 border-border"];

export function CalendarGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {days.map((day, index) => (
        <div key={day} className={`rounded-2xl border p-4 ${tones[index % tones.length]}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mar</p>
          <p className="mt-3 text-2xl font-semibold text-foreground">{day}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {index % 3 === 0 ? "Exitoso" : index % 3 === 1 ? "Dia libre usado" : "Sin registro"}
          </p>
        </div>
      ))}
    </div>
  );
}
