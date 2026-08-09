export class DomainError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message, "NOT_FOUND");
  }
}

export class InvalidBeeStateError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_BEE_STATE");
  }
}

export class DuplicateParticipantError extends DomainError {
  constructor(message: string) {
    super(message, "DUPLICATE_PARTICIPANT");
  }
}

export class ParticipantNotInBeeError extends DomainError {
  constructor(message: string) {
    super(message, "PARTICIPANT_NOT_IN_BEE");
  }
}

export class ParticipantNotEligibleError extends DomainError {
  constructor(message: string) {
    super(message, "PARTICIPANT_NOT_ELIGIBLE");
  }
}

export class RoundNotCompleteError extends DomainError {
  constructor(message: string) {
    super(message, "ROUND_NOT_COMPLETE");
  }
}

export class EmailAlreadyRegisteredError extends DomainError {
  constructor(message: string) {
    super(message, "EMAIL_ALREADY_REGISTERED");
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_CREDENTIALS");
  }
}

export class RoundInProgressError extends DomainError {
  constructor(message: string) {
    super(message, "ROUND_IN_PROGRESS");
  }
}
