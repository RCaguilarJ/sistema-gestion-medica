import styles from "./CalendarCard.module.css";
import logo from "/logo.png";

function classNames(...args) {
  return args.filter(Boolean).join(" ");
}

export default function CalendarCard({
  monthLabel,
  weekdayLabels,
  weeks,
  legend = [],
  chips = [],
  onPrev,
  onNext,
  onToday,
  onSelectDay,
}) {
  const getVariantClass = (variant) => {
    if (variant === "success") return styles.variantSuccess;
    if (variant === "warning") return styles.variantWarning;
    if (variant === "danger") return styles.variantDanger;
    return "";
  };

  return (
    <section className={styles.card}>
      <div className={styles.hero} style={{ "--hero-logo": `url(${logo})` }}>
        <button className={styles.navBtn} onClick={onPrev} aria-label="Mes anterior">
          &larr;
        </button>
        <div className={styles.monthBlock}>
          <h2>{monthLabel}</h2>
        </div>
        <div className={styles.heroActions}>
          <button className={`${styles.navBtn} ${styles.secondary}`} onClick={onToday}>
            Hoy
          </button>
          <button className={styles.navBtn} onClick={onNext} aria-label="Mes siguiente">
            &rarr;
          </button>
        </div>
      </div>

      {legend.length > 0 && (
        <div className={styles.legend}>
          {legend.map((item) => (
            <span key={item.label} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      )}

      <div className={styles.weekdays}>
        {weekdayLabels.map((label, idx) => (
          <span key={`${label}-${idx}`}>{label}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {weeks.flat().map((day, idx) => {
          if (!day?.inMonth) {
            return <div key={`empty-${idx}`} className={styles.empty} />;
          }

          return (
            <button
              key={`day-${day.label}`}
              className={classNames(
                styles.day,
                day.state === "selected" && styles.selected,
                day.state === "range" && styles.range,
                day.state === "today" && styles.today,
                day.state === "active" && styles.active,
                getVariantClass(day.variant)
              )}
              onClick={() => onSelectDay?.(day.label)}
              onDoubleClick={() => onSelectDay?.(day.label)}
              aria-label={day.ariaLabel || `Dia ${day.label}${day.count ? `, ${day.count} registros` : ""}`}
            >
              <span className={styles.dayLabel}>{day.label}</span>
              {day.count > 0 && <span className={styles.countBubble}>{day.count}</span>}
            </button>
          );
        })}
      </div>

      {chips.length > 0 && (
        <div className={styles.chips}>
          {chips.map((chip) => (
            <span key={chip} className={styles.chip}>
              {chip}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
