const TARGET_CITIES = new Set([
  // Vernon / North Okanagan
  'vernon', 'coldstream', 'armstrong', 'spallumcheen', 'lumby', 'enderby', 'salmon arm', 'sicamous',
  // West Kootenay
  'nelson', 'castlegar', 'trail', 'rossland', 'grand forks', 'creston', 'nakusp', 'kaslo', 'salmo',
  'slocan', 'fruitvale', 'warfield', 'montrose'
]);

async function testSearch() {
  const url = 'https://workbc-jb.a55eb5-prod.stratus.cloud.gov.bc.ca/api/Search/JobSearch';
  
  const payload = {
    Page: 1,
    PageSize: 100,
    SalaryMin: "",
    SalaryMax: "",
    Keyword: "administrative",
    SearchInField: "all",
    SearchIsPostingsInEnglish: true,
    SearchJobSource: "0"
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json: any = await response.json();
  if (json && json.result) {
    console.log(`Found ${json.result.length} jobs overall.`);
    const matchingJobs = json.result.filter((job: any) => {
      const city = (job.City || '').trim().toLowerCase();
      return TARGET_CITIES.has(city);
    });
    
    console.log(`Found ${matchingJobs.length} jobs in RCIP target cities:`);
    matchingJobs.forEach((job: any) => {
      console.log(`- [${job.City}] ${job.Title} at ${job.EmployerName} (ID: ${job.JobId})`);
    });
  } else {
    console.log("No jobs returned:", json);
  }
}

testSearch().catch(console.error);
