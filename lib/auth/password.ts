const strongPasswordRegex =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function isStrongPassword(value: string) {
  return strongPasswordRegex.test(value);
}

export function getPasswordPolicyMessage() {
  return "A senha deve ter no mínimo 8 caracteres, 1 letra maiúscula, 1 número e 1 caractere especial.";
}
