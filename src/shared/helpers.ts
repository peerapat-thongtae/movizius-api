export function tsvJSON(tsv: any) {
  const lines = tsv.split('\n');
  const result = [];
  const headers = lines[0].split('\t');

  for (let i = 1; i < lines.length; i++) {
    const obj: any = {};
    const currentline = lines[i].split('\t');

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j];
    }

    result.push(obj);
  }

  return result;
}

export function csvJSON(csv: any) {
  const lines = csv.split('\n');

  const result = [];

  // NOTE: If your columns contain commas in their values, you'll need
  // to deal with those before doing the next step
  // (you might convert them to &&& or something, then covert them back later)
  // jsfiddle showing the issue https://jsfiddle.net/
  const headers = lines[0].split(',');

  for (let i = 1; i < lines.length; i++) {
    const obj: any = {};
    const currentline = lines[i].split(',');

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j];
    }

    result.push(obj);
  }

  //return result; //JavaScript object
  return JSON.stringify(result); //JSON
}
