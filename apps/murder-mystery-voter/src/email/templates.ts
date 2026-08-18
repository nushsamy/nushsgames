export interface BallotEmailInput {
  participantName: string;
  eventTitle: string;
  roundNumber: number;
  votingUrl: string;
}

export interface BallotEmailContent {
  subject: string;
  html: string;
  text: string;
}

export function buildBallotEmail(input: BallotEmailInput): BallotEmailContent {
  const { participantName, eventTitle, roundNumber, votingUrl } = input;
  const subject = `${eventTitle} — Round ${roundNumber}: cast your vote`;

  const text = [
    `Hi ${participantName},`,
    "",
    `Round ${roundNumber} of "${eventTitle}" is open for voting. Who do you accuse?`,
    "",
    `Vote here: ${votingUrl}`,
    "",
    "This link is unique to you and can only be used once.",
  ].join("\n");

  const html = `
    <p>Hi ${escapeHtml(participantName)},</p>
    <p>Round ${roundNumber} of <strong>${escapeHtml(eventTitle)}</strong> is open for voting. Who do you accuse?</p>
    <p><a href="${escapeHtml(votingUrl)}">Cast your vote</a></p>
    <p style="color:#666;font-size:0.9em;">This link is unique to you and can only be used once.</p>
  `.trim();

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
