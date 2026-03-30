// Banter templates and deterministic template selection

export const LOSING_STREAK_TEMPLATES = [
  (name: string, n: number) => ({
    headline: `${name} is shitting the bed`,
    subtext: `${n} wrong in a row. Their picks are about as useful as a screen door on a submarine.`,
  }),
  (name: string, n: number) => ({
    headline: `${name} couldn't tip a bucket of water`,
    subtext: `${n} straight Ls. Couldn't pick their arse with both hands right now.`,
  }),
  (name: string, n: number) => ({
    headline: `Thoughts and prayers for ${name}`,
    subtext: `${n} wrong in a row. At this point it's genuinely impressive how shit they are.`,
  }),
  (name: string, n: number) => ({
    headline: `${name} is pissing into the wind`,
    subtext: `${n} consecutive wrong picks. A drunk toddler throwing darts would do better.`,
  }),
  (name: string, n: number) => ({
    headline: `${name} is an absolute dumpster fire`,
    subtext: `${n} wrong on the trot. Their brain is smoother than a baby's arse.`,
  }),
];

export const WINNING_STREAK_TEMPLATES = [
  (name: string, n: number) => ({
    headline: `${name} is absolutely cooking with gas`,
    subtext: `${n} correct in a row. Someone piss-test this jammy bastard.`,
  }),
  (name: string, n: number) => ({
    headline: `${name} can't bloody miss`,
    subtext: `${n} straight wins. Either a genius or the luckiest prick alive.`,
  }),
  (name: string, n: number) => ({
    headline: `${name} is making you all look like dickheads`,
    subtext: `${n} in a row. The rest of you might as well not bother showing up.`,
  }),
  (name: string, n: number) => ({
    headline: `${name} is seeing the damn Matrix`,
    subtext: `${n} correct picks running. Everyone else is just pissing money away.`,
  }),
];

export const PERFECT_PICK_TEMPLATES = [
  (name: string, event: string) => ({
    headline: `${name} is a certified genius`,
    subtext: `Only one to nail ${event}. The rest of you absolute muppets should be ashamed.`,
  }),
  (name: string, event: string) => ({
    headline: `${name} stood alone — and was bloody right`,
    subtext: `The only correct pick on ${event}. Bow down, you pack of sheep.`,
  }),
  (name: string, event: string) => ({
    headline: `${name} has massive balls on ${event}`,
    subtext: `Sole correct pick. Everyone else copied each other's homework and still failed.`,
  }),
];

export const EVERYONE_WRONG_TEMPLATES = [
  (event: string) => ({
    headline: `${event} — not one of you got it right`,
    subtext: `Zero correct picks. Collective IQ of a dead goldfish.`,
  }),
  (event: string) => ({
    headline: `Complete shitshow on ${event}`,
    subtext: `Zero correct picks. A blind dog with no legs would've done better.`,
  }),
  (event: string) => ({
    headline: `${event} made absolute mugs of the lot of you`,
    subtext: `Not one correct pick. You should all be ashamed to show your faces. Embarrassing.`,
  }),
];

export const OUTLIER_TEMPLATES = [
  (name: string, prediction: string, event: string, popular: string) => ({
    headline: `${name} has lost the plot on ${event}`,
    subtext: `Picked "${prediction}" while everyone else went "${popular}". Absolute madman or absolute moron.`,
  }),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (name: string, prediction: string, event: string, _popular: string) => ({
    headline: `${name} going full kamikaze on ${event}`,
    subtext: `"${prediction}" — nobody else had the balls (or stupidity) to go there.`,
  }),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (name: string, prediction: string, event: string, _popular: string) => ({
    headline: `What the hell is ${name} smoking?`,
    subtext: `Backing "${prediction}" against the entire pack on ${event}. Either a genius or needs a psych eval.`,
  }),
];

export const EVENT_RESULT_TEMPLATES = [
  (event: string, answer: string, correct: number, total: number) => ({
    headline: `${answer} wins ${event}`,
    subtext: `${correct} of ${total} got it right${correct === 0 ? ". Not one of you useless pricks called it" : correct === total ? ". Too bloody easy — even you lot couldn't stuff it up" : `. The other ${total - correct}? Cooked.`}`,
  }),
  (event: string, answer: string, correct: number, total: number) => ({
    headline: `${event}: it's ${answer}`,
    subtext: `${correct}/${total} called it. ${correct === 0 ? "Pathetic. Every single one of you is a fraud." : correct < total / 2 ? "Most of you are hopeless." : "Not bad for a bunch of degenerates."}`,
  }),
  (event: string, answer: string, correct: number, total: number) => ({
    headline: `${answer} gets it done — ${event}`,
    subtext: `${correct === 0 ? "Zero correct. You're all a disgrace" : correct === total ? "Everyone got it. Snooze fest" : `${correct} of ${total} nailed it. Rest of you — sort yourselves out`}.`,
  }),
];

export const CLOSE_RACE_TEMPLATES = [
  (name1: string, name2: string, gap: number) => ({
    headline: `${name1} vs ${name2} — neck and neck`,
    subtext: `Just ${gap} point${gap === 1 ? "" : "s"} in it. One shit pick and the whole thing flips. Clench up.`,
  }),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (name1: string, name2: string, _gap: number) => ({
    headline: `${name1} vs ${name2} — absolute scenes incoming`,
    subtext: `The gap at the top is razor thin. One of them is about to bottle it spectacularly.`,
  }),
];

export const CONTRARIAN_PICK_TEMPLATES = [
  (event: string, favourite: string, favOdds: string, popularPick: string, pctGroup: number) => ({
    headline: `${pctGroup}% of you are backing "${popularPick}" on ${event}`,
    subtext: `Bookies have ${favourite} at ${favOdds}. One side is going to look very stupid.`,
  }),
  (event: string, favourite: string, favOdds: string, popularPick: string, pctGroup: number) => ({
    headline: `Bookies vs the group on ${event}`,
    subtext: `${favourite} (${favOdds}) is the market pick but ${pctGroup}% of you went with "${popularPick}".`,
  }),
  (event: string, favourite: string, favOdds: string, popularPick: string, pctGroup: number) => ({
    headline: `${event}: the group disagrees with the bookies`,
    subtext: `${pctGroup}% backed "${popularPick}" over ${favourite} (${favOdds}). Brave or brain-dead?`,
  }),
];

export const UNDERDOG_BACKER_TEMPLATES = [
  (name: string, event: string, pick: string, odds: string) => ({
    headline: `${name} is off their rocker on ${event}`,
    subtext: `Backing "${pick}" at ${odds}. Either a visionary or a complete bloody lunatic.`,
  }),
  (name: string, event: string, pick: string, odds: string) => ({
    headline: `${name} loves throwing money in the bin`,
    subtext: `Picked "${pick}" (${odds}) for ${event}. That's the kind of pick that gets you sectioned.`,
  }),
  (name: string, event: string, pick: string, odds: string) => ({
    headline: `Has ${name} been drinking?`,
    subtext: `"${pick}" at ${odds} for ${event}. Either the ballsiest pick ever or the dumbest. No in between.`,
  }),
];

export const WINNERS_LIST_TEMPLATES = [
  (event: string, winners: string, losers: string) => ({
    headline: `${event} — the bloodbath scorecard`,
    subtext: `${winners} cashed in. ${losers ? `${losers} got absolutely nothing. Suck it.` : ""}`,
  }),
  (event: string, winners: string, losers: string) => ({
    headline: `${event} — winners and losers`,
    subtext: `${winners} pocketed the points. ${losers ? `${losers} can go cry about it.` : "Everyone cleaned up."}`,
  }),
  (event: string, winners: string, losers: string) => ({
    headline: `Who's laughing after ${event}?`,
    subtext: `${winners} called it. ${losers ? `${losers} — what the hell were you thinking?` : ""}`,
  }),
];

export const GROUP_CONSENSUS_TEMPLATES = [
  (event: string, pick: string, count: number, total: number) => ({
    headline: `The group has spoken on ${event}`,
    subtext: `${count} of ${total} have gone with "${pick}". The rest are taking their chances.`,
  }),
  (event: string, pick: string, count: number, total: number) => ({
    headline: `Everyone's piling on "${pick}" for ${event}`,
    subtext: `${count}/${total} picked the same thing. Bold strategy — or just the obvious answer?`,
  }),
  (event: string, pick: string, count: number, total: number) => ({
    headline: `${event}: the crowd goes with "${pick}"`,
    subtext: `${count} out of ${total} in agreement. Let's see if the herd is right this time.`,
  }),
];

export const LEADER_BANTER_TEMPLATES = [
  (name: string) => ({
    headline: `${name} is eating for free, you're all paying`,
    subtext: `Sitting pretty at the top while the rest of you mugs bankroll the meal. Must be nice.`,
  }),
  (name: string) => ({
    headline: `${name} is laughing at every single one of you`,
    subtext: `Top of the table, zero dollars owed. Living rent-free in your wallets and your heads.`,
  }),
  (name: string) => ({
    headline: `Free feed for ${name} — sucks to be everyone else`,
    subtext: `Perched at the top like royalty while the peasants below reach for their wallets.`,
  }),
];

export const LAST_PLACE_BANTER_TEMPLATES = [
  (name: string, liability: string) => ({
    headline: `Dead last: ${name} is absolutely cooked`,
    subtext: `Staring down a ${liability} lunch bill. We're ordering lobster and the top shelf. Get the credit card ready, dickhead.`,
  }),
  (name: string, liability: string) => ({
    headline: `${name} is propping up the ladder like a drunken idiot`,
    subtext: `Current lunch liability: ${liability}. At this rate we're ordering wagyu and champagne on their tab.`,
  }),
  (name: string, liability: string) => ({
    headline: `${name} is the group's personal ATM`,
    subtext: `Last place. ${liability} lunch bill. Someone start a GoFundMe because this clown is going bankrupt.`,
  }),
];

export const NEW_LEADER_TEMPLATES = [
  (name: string, prevLeader: string) => ({
    headline: `${name} has knocked ${prevLeader} off their perch`,
    subtext: `New leader. Free lunch secured. ${prevLeader} can get the wallet out now, ya mug.`,
  }),
  (name: string, prevLeader: string) => ({
    headline: `${prevLeader} just got absolutely mugged`,
    subtext: `${name} has taken the top spot. ${prevLeader} was talking shit and now they're paying for lunch. Beautiful.`,
  }),
  (name: string, prevLeader: string) => ({
    headline: `Coup at the top — ${name} takes over`,
    subtext: `${prevLeader} choked and ${name} swooped in. The throne has a new arse on it.`,
  }),
];

export const NEW_SPUD_TEMPLATES = [
  (name: string, prevSpud: string) => ({
    headline: `${name} has sunk to dead bloody last`,
    subtext: `Even ${prevSpud} is looking down at them now. Maximum lunch bill incoming. Get absolutely wrecked.`,
  }),
  (name: string, prevSpud: string) => ({
    headline: `New spud alert: ${name} is the biggest loser`,
    subtext: `${prevSpud} just dodged a bullet and ${name} caught it right in the face. Last place. Enjoy the bill, champion.`,
  }),
  (name: string, prevSpud: string) => ({
    headline: `${name} — congratulations, you useless spud`,
    subtext: `Officially dead last. ${prevSpud} sends their deepest thanks. Somebody hide ${name}'s credit card.`,
  }),
];

export const UPSET_ALERT_TEMPLATES = [
  (event: string, winner: string, favourite: string, favOdds: string) => ({
    headline: `Upset! ${winner} rolled ${favourite} — ${event}`,
    subtext: `The bookies had ${favourite} at ${favOdds}. The punters who called it are geniuses. The rest are fuming.`,
  }),
  (event: string, winner: string, favourite: string, favOdds: string) => ({
    headline: `${favourite} (${favOdds}) just got pantsed`,
    subtext: `${winner} wins ${event}. The bookies got it wrong and so did anyone dumb enough to follow them.`,
  }),
  (event: string, winner: string, favourite: string, _favOdds: string) => ({
    headline: `${event}: the bookies are crying`,
    subtext: `${winner} over ${favourite}. Absolute scenes. If you tipped the upset, take a bloody bow.`,
  }),
];

export const ACCURACY_TEMPLATES = [
  (name: string, pct: string, correct: number, total: number) => ({
    headline: `${name} is running at ${pct}`,
    subtext: `${correct} from ${total}. ${Number(pct.replace('%','')) >= 70 ? "Annoyingly good." : Number(pct.replace('%','')) <= 30 ? "Embarrassingly shit." : "Thoroughly mid."}`,
  }),
  (name: string, pct: string, correct: number, total: number) => ({
    headline: `${name}: ${correct}/${total} — ${pct} hit rate`,
    subtext: `${Number(pct.replace('%','')) >= 70 ? "Making it look too easy, the smug bastard." : Number(pct.replace('%','')) <= 30 ? "Shouldn't be allowed to make picks anymore." : "Right in the pack. Nothing to brag about."}`,
  }),
];

export const LUNCH_LIABILITY_TEMPLATES = [
  (name: string, amount: string, position: string) => ({
    headline: `${name} owes ${amount} for lunch`,
    subtext: `Currently sitting ${position}. Every wrong pick from here is going to sting.`,
  }),
  (name: string, amount: string, position: string) => ({
    headline: `${name}'s wallet: ${amount} lighter`,
    subtext: `${position} on the ladder. Better start tipping well or that bill's going up, dickhead.`,
  }),
];

export const PICKS_OPEN_TEMPLATES = [
  (event: string, pickCount: number, totalParticipants: number) => ({
    headline: `${event} — only ${pickCount}/${totalParticipants} have picked`,
    subtext: `Get your pick in before it closes or cop a zero. Don't be that person.`,
  }),
  (event: string, pickCount: number, totalParticipants: number) => ({
    headline: `${event} is still waiting on ${totalParticipants - pickCount} picks`,
    subtext: `${pickCount} in so far. If you haven't picked yet, what are you doing with your life?`,
  }),
];

/** Use a seeded index based on string hash for deterministic template selection */
export function hashPick<T>(templates: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return templates[Math.abs(hash) % templates.length];
}
