export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export const VALID_CHECKOUT_INFO: CheckoutInfo = {
  firstName: 'John',
  lastName: 'Doe',
  postalCode: '12345',
};

export const EMPTY_FIRST_NAME_CHECKOUT_INFO: CheckoutInfo = {
  firstName: '',
  lastName: 'Doe',
  postalCode: '12345',
};

export const EMPTY_LAST_NAME_CHECKOUT_INFO: CheckoutInfo = {
  firstName: 'John',
  lastName: '',
  postalCode: '12345',
};

export const EMPTY_POSTAL_CODE_CHECKOUT_INFO: CheckoutInfo = {
  firstName: 'John',
  lastName: 'Doe',
  postalCode: '',
};
