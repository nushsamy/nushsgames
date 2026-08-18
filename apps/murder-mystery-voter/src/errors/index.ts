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

export class InvalidEventStateError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_EVENT_STATE");
  }
}

export class DuplicateSuspectError extends DomainError {
  constructor(message: string) {
    super(message, "DUPLICATE_SUSPECT");
  }
}

export class DuplicateParticipantError extends DomainError {
  constructor(message: string) {
    super(message, "DUPLICATE_PARTICIPANT");
  }
}

export class RoundNotOpenError extends DomainError {
  constructor(message: string) {
    super(message, "ROUND_NOT_OPEN");
  }
}

export class RoundAlreadyOpenError extends DomainError {
  constructor(message: string) {
    super(message, "ROUND_ALREADY_OPEN");
  }
}

export class BallotNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, "BALLOT_NOT_FOUND");
  }
}

export class BallotAlreadyCastError extends DomainError {
  constructor(message: string) {
    super(message, "BALLOT_ALREADY_CAST");
  }
}

export class BallotExpiredError extends DomainError {
  constructor(message: string) {
    super(message, "BALLOT_EXPIRED");
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
