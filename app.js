// Adzuna job search dashboard - main controller.
var RESULTS_PER_PAGE = 20;
var state = { page: 1, lastQueryUrl: "", lastData: null };

function $(id) { return document.getElementById(id); }

function setStatus(msg) { $("status").textContent = msg || ""; }

function getConfig() {
var c = window.ADZUNA_CONFIG;
if (!c || !c.appId || !c.appKey || c.appId.indexOf("YOUR_") === 0) {
return null;
}
return c;
}

function readOpts() {
return {
what: $("what").value.trim(),
whatExclude: $("whatExclude").value.trim(),
where: $("where").value.trim(),
distance: $("distance").value.trim(),
country: $("country").value,
cohort: $("cohort").value,
salaryMin: $("salaryMin").value.trim(),
salaryMax: $("salaryMax").value.trim(),
contractType: $("contractType").value,
contractTime: $("contractTime").value,
sortBy: $("sortBy").value,
maxDaysOld: parseInt($("maxDaysOld").value, 10) || 0,
hideIrrelevant: $("hideIrrelevant").checked,
fullTimeOnly: $("fullTimeOnly").checked,
suppressRecruiters: $("suppressRecruiters").checked
};
}

function buildUrl(opts, cfg, page) {
var base = "https://api.adzuna.com/v1/api/jobs/" + opts.country + "/search/" + page;
var p = new URLSearchParams();
p.set("app_id", cfg.appId);
p.set("app_key", cfg.appKey);
p.set("results_per_page", String(RESULTS_PER_PAGE));
if (opts.what) p.set("what", opts.what);
if (opts.where) p.set("where", opts.where);
if (opts.distance) p.set("distance", opts.distance);
if (opts.salaryMin) p.set("salary_min", opts.salaryMin);
if (opts.salaryMax) p.set("salary_max", opts.salaryMax);
if (opts.contractType) p.set("contract_type", opts.contractType);
if (opts.contractTime) p.set("contract_time", opts.contractTime);
if (opts.sortBy && opts.sortBy !== "relevance") p.set("sort_by", opts.sortBy);
return base + "?" + p.toString();
}

function redactUrl(url) {
return url.replace(/app_key=[^&]+/, "app_key=***").replace(/app_id=[^&]+/, "app_id=***");
}

function esc(s) {
return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function salaryText(job) {
if (job.salary_min && job.salary_max) return "$" + Math.round(job.salary_min).toLocaleString() + " - $" + Math.round(job.salary_max).toLocaleString();
if (job.salary_min) return "from $" + Math.round(job.salary_min).toLocaleString();
return "salary n/a";
}

function cardHtml(job) {
var company = job.company && job.company.display_name ? job.company.display_name : "Unknown company";
var loc = job.location && job.location.display_name ? job.location.display_name : "";
var tags = "";
if (job.contract_time) tags += '<span class="tag">' + esc(job.contract_time) + "</span>";
if (job.contract_type) tags += '<span class="tag">' + esc(job.contract_type) + "</span>";
if (job._flags) { for (var i = 0; i < job._flags.length; i++) tags += '<span class="tag warn">' + esc(job._flags[i]) + "</span>"; }
var desc = esc((job.description || "").slice(0, 240));
return '<div class="card">' +
'<h3><a href="' + esc(job.redirect_url) + '" target="_blank" rel="noopener">' + esc(job.title) + "</a></h3>" +
'<div class="meta"><span>' + esc(company) + "</span><span>" + esc(loc) + "</span><span>" + salaryText(job) + "</span></div>" +
'<div class="desc">' + desc + "...</div>" +
'<div class="tags">' + tags + "</div>" +
"</div>";
}

function render(data, opts) {
var jobs = (data && data.results) ? data.results : [];
var result = window.JobFilters.applyFilters(jobs, opts);
var kept = result.kept;
$("cards").innerHTML = kept.length ? kept.map(cardHtml).join("") : '<div class="empty">No matching jobs after filters. Try loosening filters.</div>';
var total = data && data.count ? data.count : 0;
$("count").textContent = "Showing " + kept.length + " of " + jobs.length + " on this page (" + result.suppressed.length + " suppressed). API total: " + total.toLocaleString();
$("pageLabel").textContent = "Page " + state.page;
$("debug").textContent = "GET " + redactUrl(state.lastQueryUrl) + "\n\nSuppressed examples:\n" + result.suppressed.slice(0, 5).map(function (j) { return "- " + j.title + " [" + (j._reasons || []).join(", ") + "]"; }).join("\n");
}

function runSearch() {
var cfg = getConfig();
if (!cfg) { setStatus("Missing API credentials - copy config.example.js to config.js and add your Adzuna keys."); return; }
var opts = readOpts();
var url = buildUrl(opts, cfg, state.page);
state.lastQueryUrl = url;
setStatus("Searching...");
fetch(url)
.then(function (r) { if (!r.ok) throw new Error("API error " + r.status); return r.json(); })
.then(function (data) { state.lastData = data; render(data, opts); setStatus(""); })
.catch(function (e) { setStatus("Error: " + e.message); $("cards").innerHTML = '<div class="empty">Request failed. Check credentials, country, and rate limits.</div>'; });
}

function resetForm() {
["what", "whatExclude", "where", "salaryMin", "salaryMax", "maxDaysOld"].forEach(function (id) { $(id).value = ""; });
$("distance").value = "25";
$("cohort").value = "general";
$("contractType").value = "";
$("contractTime").value = "";
$("sortBy").value = "relevance";
$("hideIrrelevant").checked = true;
$("fullTimeOnly").checked = false;
$("suppressRecruiters").checked = false;
state.page = 1;
}

document.addEventListener("DOMContentLoaded", function () {
$("searchBtn").addEventListener("click", function () { state.page = 1; runSearch(); });
$("resetBtn").addEventListener("click", resetForm);
$("debugBtn").addEventListener("click", function () { $("debug").classList.toggle("hidden"); });
$("nextBtn").addEventListener("click", function () { state.page++; runSearch(); });
$("prevBtn").addEventListener("click", function () { if (state.page > 1) { state.page--; runSearch(); } });
if (!getConfig()) setStatus("Add your Adzuna keys in config.js to start searching.");
});
