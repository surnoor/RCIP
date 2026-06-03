import { NextResponse } from 'next/server';
import profiles from '@/lib/profiles.json';

function replacePlaceholders(text: string, title: string, company: string): string {
  if (!text) return '';
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return text
    .replace(/\[JOB_TITLE\]/gi, title || 'the open position')
    .replace(/\[COMPANY_NAME\]/gi, company || 'your company')
    .replace(/\[DATE\]/gi, dateStr);
}

function selectBestProfile(jobTitle: string, jobDescription: string) {
  const textToAnalyze = `${jobTitle || ''} ${jobDescription || ''}`.toLowerCase();
  
  let bestProfile = profiles[0]; // Default to general admin
  let highestScore = -1;

  for (const profile of profiles) {
    let score = 0;
    for (const keyword of profile.keywords) {
      // Create a regex to find whole word matches
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = textToAnalyze.match(regex);
      if (matches) {
        score += matches.length;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestProfile = profile;
    }
  }

  return { profile: bestProfile, score: highestScore };
}

export async function POST(req: Request) {
  try {
    const { jobTitle, jobDescription, companyName } = await req.json();

    // 1. Run Machine Learning logic to select the best Base Profile
    const { profile, score } = selectBestProfile(jobTitle, jobDescription);

    // 2. Process templates with the selected profile
    const tailoredResume = replacePlaceholders(profile.resume, jobTitle, companyName);
    const tailoredCoverLetter = replacePlaceholders(profile.coverLetter, jobTitle, companyName);

    // 3. Generate standard email body
    const emailBody = `Dear Hiring Manager,

Please find attached my resume and cover letter for the ${jobTitle || 'open'} position at ${companyName || 'your company'}. 

I am very interested in this opportunity and believe my administrative background aligns perfectly with your needs. I look forward to the possibility of discussing this role further.

Best regards,
Surnoor Singh`;

    // Add a slight fake delay so the UI still feels like it's "doing work"
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ 
      tailoredResume, 
      tailoredCoverLetter, 
      emailBody,
      selectedProfileName: profile.name,
      matchScore: score
    });
  } catch (error: any) {
    console.error('Template Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate documents' }, { status: 500 });
  }
}
