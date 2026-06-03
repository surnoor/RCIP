async function testDetail() {
  const url = 'https://workbc-jb.a55eb5-prod.stratus.cloud.gov.bc.ca/api/Search/GetJobDetail?jobId=49628825&language=en&isToggle=false';
  console.log("Fetching job details from:", url);
  const response = await fetch(url);
  const json: any = await response.json();
  
  if (json && json.result && json.result.length > 0) {
    const job = json.result[0];
    console.log(JSON.stringify(job, null, 2));
  } else {
    console.log("No job details found in response:", json);
  }
}

testDetail().catch(console.error);
