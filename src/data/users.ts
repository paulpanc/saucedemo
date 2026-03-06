export interface User {
  username: string;
  password: string;
}

export const STANDARD_USER: User = {
  username: 'standard_user',
  password: 'secret_sauce',
};

export const LOCKED_USER: User = {
  username: 'locked_out_user',
  password: 'secret_sauce',
};

export const PROBLEM_USER: User = {
  username: 'problem_user',
  password: 'secret_sauce',
};

export const PERFORMANCE_GLITCH_USER: User = {
  username: 'performance_glitch_user',
  password: 'secret_sauce',
};

export const ERROR_USER: User = {
  username: 'error_user',
  password: 'secret_sauce',
};

export const VISUAL_USER: User = {
  username: 'visual_user',
  password: 'secret_sauce',
};
