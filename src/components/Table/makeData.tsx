export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  state: string;
};

export const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois",
  "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana",
  "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
  "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

export const fakeData: User[] = Array.from({ length: 20 }, (_, index) => ({
  id: (index + 1).toString(),
  firstName: `FirstName${index + 1}`,
  lastName: `LastName${index + 1}`,
  email: `user${index + 1}@example.com`,
  state: usStates[Math.floor(Math.random() * usStates.length)],
}));
