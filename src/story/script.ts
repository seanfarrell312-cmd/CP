// Story Phase 1 script (D53), from STORY_EXPANSION_SPEC.md Appendix A. One entry per click.
// Wording changes need the owner's approval.

export type StoryId =
  | 'intro.emergencyComic'
  | 'intro.supervisorBoot'
  | 'S01.dayTutorial'
  | 'S01.nightTutorial'
  | 'S01.supervisorOutro'
  | 'S02.supervisorOutro';

export const SCRIPT: Record<Exclude<StoryId, 'intro.emergencyComic'>, string[]> = {
  'intro.supervisorBoot': [
    'Hello?',
    'Scrubby? Do you read me?',
    "Oh wow! It's working! Your signal is coming in clear.",
    "We haven't heard anything from this site in some time. Good to see that your systems are up and running.",
    'Running facility diagnostics...',
    'Huh...',
    "It looks like the facility is pretty low on POWA. But that's why we have you! :)",
    "We'll deploy your unit onto the first Power Panel and get you started.",
  ],
  'S01.dayTutorial': [
    'Deployment to Power Panel 1 was successful! Looks like the problem is all that FILTH built up on the power cells.',
    'Use the W A S D keys to move around the Power Panel and scrub off the grime.',
    "It may take a few repeated scrubs to completely clean off each cell, so don't be afraid to scrub in a circle for a bit.",
    'Once you have enough POWA banked, you can purchase advanced systems to help speed along the process. We even have some WAX in store you can deploy to help keep the Power Panel clean.',
    "We'll reach out at the end of the day to check back in. Good luck!",
  ],
  'S01.nightTutorial': [
    'Great job scrubbing! We are detecting POWA flowing into the on-site systems.',
    'Our scans are detecting some local fauna approaching Power Panel 1. Probably just some Mud Boys. This planet is lousy with them.',
    "They're relatively harmless, but have a nasty habit of spreading FILTH wherever they go. That's where you come in. :)",
    'Use the mouse to click on any Mud Boys that get on the Power Panel to give them a little push with our patented SCRUB TURRET. If you hit them quickly enough, they will tumble right off. The more stubborn ones may need a bit more pressure to deal with.',
    "Don't worry about hurting them. They're just Mud Boys. They don't feel a thing.",
    "Deal with them quickly or you'll be stuck cleaning this Power Panel forever. You'll see what I mean.",
    'Good luck!',
  ],
  'S01.supervisorOutro': [
    'You did it! Power Panel 1 is completely clean.',
    "You probably saw already, but the Power Panel's clean state enabled the perimeter defense to activate.",
    'That should keep the Mud Boys out for good. I wonder how they got lowered in the first place?',
    "We're sending you to Power Panel 2 now. It's the main POWA supply for the whole Facility.",
    "It's a bit bigger than the last one, so make sure to use your Banked POWA to improve your loadout.",
    "We're still reading a lot of Mud Boy activity out there, so stay alert.",
  ],
  'S02.supervisorOutro': [
    "Fantastic job, Scrubby! We are seeing the Facility's primary systems back online!",
    "It's good to see POWA flowing again. Hard to believe you've been offline for so long.",
    "We still aren't getting any readings from within the Facility, so I guess that's where we are sending you next. :)",
    "Don't worry about maintaining Power Panels 1 and 2. The perimeter fences should keep them safe and POWA flowing.",
    "Despite all the POWA we're gathering, we will still need a little more to access the Facility.",
    "There's a main office complex nearby that appears to be in lockdown. It has some Emergency Panels set up that we can use to trigger the Disarm Protocols to access the interior.",
    "All you've got to do is use your loadout to clean the Emergency Panels and we'll have full access again!",
    "The Emergency Panels have fewer power cells than you'd expect, but there's a trick to cleaning them you'll have to decipher once you're there.",
    'Stay alert for Mud Boys. If all goes well, there might even be a promotion in it for you.',
  ],
};
