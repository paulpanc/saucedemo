export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export const CHECKOUT_INFO: Record<string, CheckoutInfo> = {
  valid: {
    firstName: 'John',
    lastName: 'Doe',
    postalCode: '12345',
  },
  emptyFirstName: {
    firstName: '',
    lastName: 'Doe',
    postalCode: '12345',
  },
  emptyLastName: {
    firstName: 'John',
    lastName: '',
    postalCode: '12345',
  },
  emptyPostalCode: {
    firstName: 'John',
    lastName: 'Doe',
    postalCode: '',
  },
};
