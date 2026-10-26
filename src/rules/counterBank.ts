// Scrub / Shoot counter bank with its recharge timer.
// D04: the timer runs whenever the bank is below max and stops (reset) when full.
// D05: each completed timer adds exactly +1, never above max.
export interface CounterBank {
  max: number;
  count: number;
  duration: number; // seconds per counter
  elapsed: number; // progress of the current recharge cycle
}

export function createBank(max: number, duration: number): CounterBank {
  return { max, count: max, duration, elapsed: 0 };
}

// D26: banks start each phase full with a fresh timer.
export function resetBank(bank: CounterBank): void {
  bank.count = bank.max;
  bank.elapsed = 0;
}

export function spend(bank: CounterBank): boolean {
  if (bank.count <= 0) return false;
  bank.count--;
  return true;
}

export function tickBank(bank: CounterBank, dt: number): void {
  if (bank.count >= bank.max) {
    bank.elapsed = 0;
    return;
  }
  bank.elapsed += dt;
  while (bank.elapsed >= bank.duration && bank.count < bank.max) {
    bank.elapsed -= bank.duration;
    bank.count++;
  }
  if (bank.count >= bank.max) bank.elapsed = 0;
}

// 0..1 progress of the running recharge, for the HUD.
export function rechargeProgress(bank: CounterBank): number {
  return bank.count >= bank.max ? 0 : bank.elapsed / bank.duration;
}
