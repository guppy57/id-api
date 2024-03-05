export function getPrismaStyleDateTime(): string {
  const date = new Date();

  // Extract the date components
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are zero-based
  const day = ('0' + date.getDate()).slice(-2);
  const hours = ('0' + date.getHours()).slice(-2);
  const minutes = ('0' + date.getMinutes()).slice(-2);
  const seconds = ('0' + date.getSeconds()).slice(-2);
  const milliseconds = ('00' + date.getMilliseconds()).slice(-3);

  // Construct the datetime string
  const datetimeString =
    year +
    '-' +
    month +
    '-' +
    day +
    ' ' +
    hours +
    ':' +
    minutes +
    ':' +
    seconds +
    '.' +
    milliseconds;

  return datetimeString;
}
