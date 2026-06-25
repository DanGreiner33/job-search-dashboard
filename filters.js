// Client-side post-query filtering and age-cohort relevance logic.
// Adzuna's API returns broad results; these rules suppress listings that
// are irrelevant or inappropriate for the selected cohort.

var COHORT_PRESETS = {
general: { negativeTitle: [], maxSalaryHint: null },
teen: {
negativeTitle: ["senior", "lead", "manager", "director", "rn ", "registered nurse", "attorney", "cdl", "truck driver", "licensed", "phd", "md ", "executive", "vp ", "director of", "5+ years", "10+ years", "clearance", "adult"],
maxSalaryHint: 60000
},
early: {
negativeTitle: ["senior", "lead", "director", "vp ", "head of", "principal", "10+ years"],
maxSalaryHint: null
}
};

var JUNK_PATTERNS = ["earn from home", "be your own boss", "unlimited earning", "commission only", "commission-only", "100% commission", "mlm", "network marketing", "sign-on bonus today", "start today no experience needed cash"];

function textOf(job) {
var t = (job.title || "") + " " + (job.description || "") + " " + (job.company && job.company.display_name ? job.company.display_name : "");
return t.toLowerCase();
}

function matchesAny(haystack, words) {
for (var i = 0; i < words.length; i++) {
if (words[i] && haystack.indexOf(words[i]) !== -1) return words[i];
}
return null;
}

// Returns { keep: bool, reasons: [..], flags: [..] }
function evaluateJob(job, opts) {
var reasons = [];
var flags = [];
var hay = textOf(job);

var excludeWords = (opts.whatExclude || "").toLowerCase().split(",").map(function (s) { return s.trim(); }).filter(Boolean);
var hitExclude = matchesAny(hay, excludeWords);
if (hitExclude) { reasons.push("excluded word: " + hitExclude); }

var cohort = COHORT_PRESETS[opts.cohort] || COHORT_PRESETS.general;
var title = (job.title || "").toLowerCase();
var hitNeg = matchesAny(title, cohort.negativeTitle);
if (hitNeg && opts.hideIrrelevant) { reasons.push("cohort mismatch: " + hitNeg.trim()); }
else if (hitNeg) { flags.push("cohort: " + hitNeg.trim()); }

if (opts.fullTimeOnly) {
var hitJunk = matchesAny(hay, JUNK_PATTERNS);
if (hitJunk) { reasons.push("unpaid/commission-only: " + hitJunk); }
}

if (opts.maxDaysOld && job.created) {
var created = new Date(job.created).getTime();
var ageDays = (Date.now() - created) / 86400000;
if (ageDays > opts.maxDaysOld) { reasons.push("older than " + opts.maxDaysOld + " days"); }
}

if (cohort.maxSalaryHint && job.salary_min && job.salary_min > cohort.maxSalaryHint * 1.5 && opts.hideIrrelevant) {
flags.push("high salary for cohort");
}

return { keep: reasons.length === 0, reasons: reasons, flags: flags };
}

function applyFilters(jobs, opts) {
var kept = [];
var suppressed = [];
for (var i = 0; i < jobs.length; i++) {
var r = evaluateJob(jobs[i], opts);
if (r.keep) { jobs[i]._flags = r.flags; kept.push(jobs[i]); }
else { jobs[i]._reasons = r.reasons; suppressed.push(jobs[i]); }
}
return { kept: kept, suppressed: suppressed };
}

window.JobFilters = { applyFilters: applyFilters, evaluateJob: evaluateJob, COHORT_PRESETS: COHORT_PRESETS };
