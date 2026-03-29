export function validateUserName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: '이름을 입력해주세요.' };
  }
  if (name.length > 20) {
    return { valid: false, error: '이름은 20자 이하여야 합니다.' };
  }
  return { valid: true };
}

export function validateMessageLength(message: string): { valid: boolean; error?: string } {
  if (!message || message.length === 0) {
    return { valid: false, error: '메시지를 입력해주세요.' };
  }
  if (message.length > 1000) {
    return { valid: false, error: '메시지는 1000자 이하여야 합니다.' };
  }
  return { valid: true };
}
