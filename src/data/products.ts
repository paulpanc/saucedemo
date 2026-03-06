export interface Product {
  name: string;
  price: number;
}

export const BACKPACK_PRODUCT: Product = {
  name: 'Sauce Labs Backpack',
  price: 29.99,
};

export const BIKE_LIGHT_PRODUCT: Product = {
  name: 'Sauce Labs Bike Light',
  price: 9.99,
};

export const BOLT_TSHIRT_PRODUCT: Product = {
  name: 'Sauce Labs Bolt T-Shirt',
  price: 15.99,
};

export const FLEECE_JACKET_PRODUCT: Product = {
  name: 'Sauce Labs Fleece Jacket',
  price: 49.99,
};

export const ONESIE_PRODUCT: Product = {
  name: 'Sauce Labs Onesie',
  price: 7.99,
};

export const RED_TSHIRT_PRODUCT: Product = {
  name: 'Test.allTheThings() T-Shirt (Red)',
  price: 15.99,
};

export const ALL_PRODUCTS: Product[] = [
  BACKPACK_PRODUCT,
  BIKE_LIGHT_PRODUCT,
  BOLT_TSHIRT_PRODUCT,
  FLEECE_JACKET_PRODUCT,
  ONESIE_PRODUCT,
  RED_TSHIRT_PRODUCT,
];

export const PRODUCT_COUNT = ALL_PRODUCTS.length;
