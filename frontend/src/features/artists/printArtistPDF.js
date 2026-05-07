export function printArtistPDF(artist) {
  const aadhaarMasked = artist.aadhaar_number ? `XXXX-XXXX-${artist.aadhaar_number.slice(-4)}` : '-'
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
  body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#222;font-size:13px}
  h1{color:#ea580c;font-size:22px;margin:0 0 4px}
  .subtitle{color:#777;font-size:12px;margin-bottom:20px}
  .header{display:flex;align-items:flex-start;gap:20px;border-bottom:2px solid #ea580c;padding-bottom:16px;margin-bottom:16px}
  .photo{width:90px;height:110px;object-fit:cover;border:1px solid #ddd;border-radius:4px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:32px;color:#ea580c}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;margin-bottom:12px}
  .field{padding:5px 0;border-bottom:1px solid #f0f0f0}
  .field-label{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px}
  .field-value{font-size:13px;font-weight:600;margin-top:2px}
  .section-title{background:#ea580c;color:#fff;padding:4px 10px;font-size:11px;font-weight:bold;letter-spacing:1px;margin:14px 0 8px;text-transform:uppercase}
  .badge{display:inline-block;background:#dcfce7;color:#166534;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600}
  .footer{margin-top:30px;border-top:1px solid #eee;padding-top:10px;font-size:10px;color:#aaa;text-align:center}
  @media print{body{margin:0}}
</style></head>
<body>
<div class="header">
  ${artist.profile_photo ? `<img class="photo" src="${artist.profile_photo}" alt="Photo"/>` : `<div class="photo">${artist.full_name?.[0] || '?'}</div>`}
  <div style="flex:1">
    <h1>${artist.full_name}</h1>
    <div class="subtitle">${artist.art_form}${artist.art_form_other ? ` - ${artist.art_form_other}` : ''}</div>
    <span class="badge">${artist.status?.toUpperCase() || 'ACTIVE'}</span>
    <p style="font-size:11px;color:#555;margin-top:8px">Registration Proof - Cultural Art Zone</p>
    <p style="font-size:10px;color:#aaa;margin:2px 0">Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
  </div>
</div>
<div class="section-title">Personal Information</div>
<div class="info-grid">
  <div class="field"><div class="field-label">Email</div><div class="field-value">${artist.email || '-'}</div></div>
  <div class="field"><div class="field-label">Phone</div><div class="field-value">${artist.phone || '-'}</div></div>
  <div class="field"><div class="field-label">Location</div><div class="field-value">${artist.location || '-'}</div></div>
  <div class="field"><div class="field-label">State</div><div class="field-value">${artist.state || '-'}</div></div>
  <div class="field"><div class="field-label">Caste Category</div><div class="field-value">${artist.caste || '-'}${artist.caste_other ? ` (${artist.caste_other})` : ''}</div></div>
  <div class="field"><div class="field-label">Aadhaar</div><div class="field-value">${aadhaarMasked}</div></div>
</div>
<div class="section-title">Artistic Profile</div>
<div class="info-grid">
  <div class="field"><div class="field-label">Art Form</div><div class="field-value">${artist.art_form || '-'}${artist.art_form_other ? ` - ${artist.art_form_other}` : ''}</div></div>
  <div class="field"><div class="field-label">Experience</div><div class="field-value">${artist.years_of_experience || 0} years</div></div>
  <div class="field"><div class="field-label">Artistic Qualification</div><div class="field-value">${artist.artistic_qualification || '-'}${artist.artistic_qualification_other ? ` (${artist.artistic_qualification_other})` : ''}</div></div>
  <div class="field"><div class="field-label">Educational Qualification</div><div class="field-value">${artist.educational_qualification || '-'}${artist.educational_qualification_other ? ` (${artist.educational_qualification_other})` : ''}</div></div>
</div>
${artist.biography ? `<div class="section-title">Biography</div><p style="font-size:12px;line-height:1.6;color:#444">${artist.biography}</p>` : ''}
<div class="footer">This document is a system-generated registration proof from the Cultural Art Zone platform. For verification contact admin@culturalzone.com</div>
</body></html>`

  const win = window.open('', '_blank', 'width=800,height=900')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 500)
}
