export function generateMatchdays(teamIds: string[]) {
  let ids = [...teamIds];
  if (ids.length % 2 !== 0) ids.push(null as unknown as string);
  const n = ids.length;
  const rounds = n - 1;
  const half = n / 2;
  let arr = [...ids];
  const matchdays: { id: string; homeId: string; awayId: string; homeScore: number; awayScore: number; status: string }[][] = [];
  for (let r = 0; r < rounds; r++) {
    const round: { id: string; homeId: string; awayId: string; homeScore: number; awayScore: number; status: string }[] = [];
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a !== null && b !== null) {
        round.push({
          id: `m-${r}-${i}`,
          homeId: r % 2 === 0 ? a : b,
          awayId: r % 2 === 0 ? b : a,
          homeScore: 0,
          awayScore: 0,
          status: "scheduled",
        });
      }
    }
    matchdays.push(round);
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)];
  }
  return matchdays;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function generateDaySlots(pitchIds: string[], dailyStart: string, dailyEnd: string, duration: number, gap: number) {
  const slots: { pitchId: string; time: string }[] = [];
  const startM = timeToMinutes(dailyStart);
  const endM = timeToMinutes(dailyEnd);
  let t = startM;
  while (t + duration <= endM) {
    pitchIds.forEach((pid) => slots.push({ pitchId: pid, time: minutesToTime(t) }));
    t += duration + gap;
  }
  return slots;
}

export function autoSchedule(
  matchdays: { id: string; homeId: string; awayId: string; homeScore: number; awayScore: number; status: string }[][],
  config: {
    pitchIds: string[];
    dailyStart: string;
    dailyEnd: string;
    matchDuration: number;
    gap: number;
    startDate: string;
  }
) {
  const slotsTemplate = generateDaySlots(config.pitchIds, config.dailyStart, config.dailyEnd, config.matchDuration, config.gap);
  const scheduled: { id: string; homeId: string; awayId: string; homeScore: number; awayScore: number; status: string; matchday: number; scheduledDate: string; scheduledTime: string; pitchId: string; overflow?: boolean }[] = [];
  let overflowDayOffset = matchdays.length;
  matchdays.forEach((matchday, d) => {
    const date = addDays(config.startDate, d);
    matchday.forEach((m, i) => {
      if (i < slotsTemplate.length) {
        const slot = slotsTemplate[i];
        scheduled.push({ ...m, matchday: d, scheduledDate: date, scheduledTime: slot.time, pitchId: slot.pitchId });
      } else {
        const overflowIdx = i - slotsTemplate.length;
        const overflowDate = addDays(config.startDate, overflowDayOffset + Math.floor(overflowIdx / slotsTemplate.length));
        const slot = slotsTemplate[overflowIdx % slotsTemplate.length];
        scheduled.push({ ...m, matchday: d, scheduledDate: overflowDate, scheduledTime: slot.time, pitchId: slot.pitchId, overflow: true });
      }
    });
    if (matchday.length > slotsTemplate.length) overflowDayOffset += Math.ceil((matchday.length - slotsTemplate.length) / slotsTemplate.length);
  });
  return scheduled;
}

export function computeStandings(
  matches: { homeId: string; awayId: string; homeScore: number; awayScore: number; status: string }[],
  teamIds: string[],
  teamsById: Record<string, { name: string; color: string }>,
  pointsWin: number,
  pointsDraw: number
) {
  const table: Record<string, { id: string; name: string; color: string; played: number; won: number; draw: number; lost: number; gf: number; ga: number; pts: number }> = {};
  teamIds.forEach((id) => {
    table[id] = { id, name: teamsById[id]?.name || "Unknown", color: teamsById[id]?.color || "", played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
  });
  matches.forEach((m) => {
    if (m.status !== "finished" && m.status !== "forfeited") return;
    const h = table[m.homeId];
    const a = table[m.awayId];
    if (!h || !a) return;
    h.played += 1;
    a.played += 1;
    h.gf += m.homeScore;
    h.ga += m.awayScore;
    a.gf += m.awayScore;
    a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) {
      h.won += 1;
      h.pts += pointsWin;
      a.lost += 1;
    } else if (m.homeScore < m.awayScore) {
      a.won += 1;
      a.pts += pointsWin;
      h.lost += 1;
    } else {
      h.draw += 1;
      a.draw += 1;
      h.pts += pointsDraw;
      a.pts += pointsDraw;
    }
  });
  return Object.values(table).sort(
    (x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.name.localeCompare(y.name)
  );
}