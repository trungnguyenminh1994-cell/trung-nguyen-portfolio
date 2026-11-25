/* BMW OSB + Admin demo data. One file, every page reads it (webapp C10.3).
   Never real (sample-data.md): people, phones, emails (example.com), plates and VINs are invented.
   Dealer names are the two live test profiles Trung named; their settings, service lists, job codes,
   hours and prices are the values shown by the live test profiles on 2026-10-30 (sample, not BMW pricing).
   Demo "today" is fixed so weekdays never drift (webapp C11c). */
window.BMW_DATA = (function () {
  'use strict';
  var today = '2026-10-30';

  var services = [
    // [id, name, jobCode, estHours, price]  · category Service
    ['oil', 'Oil Service', 'SOLOIL', 1, 180],
    ['general', 'General Service', 'SOLSERVOVR', 1, 180],
    ['brake', 'Brake Service', 'SOLBRKFLUSHDUE', 0.33, 60],
    ['wof', 'Statutory vehicle Inspection WOF', '21974', 1, 54.95],
    ['recall', 'Recall', '21979', 1, 54.95],
    ['fluid', 'Brake Fluid flush overdue', '4', 1, 180],
    ['frontbrake', 'Front Brake Service', '21970', 1, 90],
    ['cabin', 'Micro-filter/Cabin Filter Replacement', '21975', 0.5, 70],
    ['rearbrake', 'Rear Brake Service', '21971', 1, 90],
    ['overdue', 'Service overdue', 'SOLSERVOVR', 1, 210],
    ['check', 'Vehicle Check', '21976', 0.5, 70],
    ['mot', 'Carry out MOT', '21977', 1, 54.95]
  ].map(function (r) { return { id: r[0], name: r[1], code: r[2], hours: r[3], price: r[4], category: 'Service' }; });

  var surveyYesNo = [
    { id: 'q1', text: 'Are you looking at changing your vehicle soon?', type: 'single', options: ['Yes', 'No'] },
    { id: 'q2', text: 'Would you like an insurance quote?', type: 'single', options: ['Yes', 'No'] },
    { id: 'q3', text: 'Would you like a mechanical breakdown insurance quote?', type: 'single', options: ['Yes', 'No'] }
  ];

  var dealers = [
    {
      id: 'so10', name: 'Auckland City BMW Test SO10', short: 'Auckland City BMW', code: 'ACBMW10TST',
      country: 'New Zealand', countryCode: 'NZ', region: 'Northern', city: 'Auckland', cluster: 'Regional', state: '',
      timezone: 'Pacific/Auckland', brand: 'BMW', brands: ['BMW', 'MINI'],
      address: '1 Example Road, Newmarket, Auckland 1023', phone: '+64 9 555 0110', email: 'so10.service@example.com',
      enquiries: 'enquiries.so10@example.com', web: 'www.so10.example.com', abn: '[sample] 00 000 000 010', lmct: '[sample] 10010',
      leadHours: 96, maxPerDay: 40, serviceOptions: [], portalAccess: true, hideOnOsb: false, emailConfirm: true, emailNoBookings: false,
      alertEmails: ['service.alerts@example.com', 'manager.so10@example.com', 'osb.team@example.com'],
      services: ['oil', 'general', 'brake', 'wof', 'recall', 'fluid', 'frontbrake', 'cabin', 'rearbrake', 'overdue', 'check', 'mot'],
      survey: { status: 'published', published: '2026-09-09', questions: surveyYesNo.concat([{ id: 'q4', text: 'Ask me any question', type: 'short', options: [] }]) }
    },
    {
      id: 'so30', name: 'East Auckland BMW Test SO30', short: 'East Auckland BMW', code: 'EABMW30TST',
      country: 'New Zealand', countryCode: 'NZ', region: 'Northern', city: 'Auckland', cluster: 'Regional', state: '',
      timezone: 'Pacific/Auckland', brand: 'BMW', brands: ['BMW', 'MINI'],
      address: '48 Example Avenue, Botany, Auckland 2013', phone: '+64 9 555 0130', email: 'so30.service@example.com',
      enquiries: 'enquiries.so30@example.com', web: 'www.so30.example.com', abn: '[sample] 00 000 000 030', lmct: '[sample] 10030',
      leadHours: 24, maxPerDay: 40, serviceOptions: ['After Hours Key Drop Off', 'Shuttle', 'Mobility'], portalAccess: true, hideOnOsb: false,
      emailConfirm: true, emailNoBookings: false,
      alertEmails: ['service.alerts@example.com', 'manager.so30@example.com'],
      services: ['oil', 'general', 'brake', 'wof', 'recall', 'fluid', 'frontbrake', 'cabin', 'rearbrake', 'overdue', 'check'],
      survey: { status: 'published', published: '2026-09-18', questions: surveyYesNo.slice() }
    }
  ];

  var vehicles = [
    { rego: 'DEMO01', make: 'BMW', model: '3 Series', variant: '330i M Sport', year: 2023, vin: 'WBA5R1C05PFH12873', label: 'BMW 330i M Sport' },
    { rego: 'DEMO02', make: 'BMW', model: 'X3', variant: 'xDrive20d', year: 2022, vin: 'WBA7Y3C09NDV48215', label: 'BMW X3 xDrive20d' },
    { rego: 'DEMO03', make: 'MINI', model: 'Cooper', variant: 'S 3-Door', year: 2024, vin: 'WMW21GD07R2T60394', label: 'MINI Cooper S 3-Door' },
    { rego: 'DEMO04', make: 'BMW', model: 'X5', variant: 'xDrive40i', year: 2021, vin: 'WBA5V7C08MAF27651', label: 'BMW X5 xDrive40i' },
    { rego: 'DEMO05', make: 'BMW_I', model: 'iX3', variant: 'M Sport', year: 2025, vin: 'WBY7X2C04SBN83142', label: 'BMW iX3 M Sport' }
  ];

  var makes = {
    BMW: { '3 Series': ['320i', '330i M Sport', '330e'], 'X3': ['xDrive20d', 'xDrive30e', 'M40i'], 'X5': ['xDrive40i', 'xDrive50e'] },
    BMW_I: { 'iX3': ['M Sport'], 'i4': ['eDrive35', 'M50'], 'iX': ['xDrive50'] },
    MINI: { 'Cooper': ['C 3-Door', 'S 3-Door', 'S 5-Door'], 'Countryman': ['C', 'S ALL4'] }
  };

  var customers = [
    { id: 'c1', first: 'Alex', last: 'Harper', mobile: '+64 21 555 0101', email: 'alex.harper@example.com', address: '14 Example Street', city: 'Auckland', postcode: '1011', suburb: 'Ponsonby', company: '', vehicles: ['DEMO01'], dealer: 'so10', active: true, note: '' },
    { id: 'c2', first: 'Jamie', last: 'Reed', mobile: '+64 21 555 0102', email: 'jamie.reed@example.com', address: '7 Sample Lane', city: 'Auckland', postcode: '2013', suburb: 'Botany', company: 'Reed Logistics [sample]', vehicles: ['DEMO02'], dealer: 'so30', active: true, note: 'Prefers morning drop-off.' },
    { id: 'c3', first: 'Morgan', last: 'Ellis', mobile: '+64 22 555 0103', email: 'morgan.ellis@example.com', address: '220 Example Road', city: 'Auckland', postcode: '1050', suburb: 'Remuera', company: '', vehicles: ['DEMO03'], dealer: 'so10', active: true, note: '' },
    { id: 'c4', first: 'Priya', last: 'Nair', mobile: '+64 27 555 0104', email: 'priya.nair@example.com', address: '3 Placeholder Place', city: 'Auckland', postcode: '2016', suburb: 'Howick', company: '', vehicles: ['DEMO04'], dealer: 'so30', active: true, note: '' },
    { id: 'c5', first: 'Sam', last: 'Taylor', mobile: '+64 21 555 0105', email: 'sam.taylor@example.com', address: '91 Demo Crescent', city: 'Auckland', postcode: '1022', suburb: 'Grey Lynn', company: '', vehicles: ['DEMO05'], dealer: 'so10', active: true, note: '' }
  ];

  // [wip, customer, rego, dealer, date, time, status, source, services[], created]
  var bookingRows = [
    [10126, 'c1', 'DEMO01', 'so10', '2026-11-03', '08:00', 'booked', 'online', ['oil'], '2026-10-28 21:05'],
    [10227, 'c3', 'DEMO03', 'so10', '2026-11-04', '09:00', 'booked', 'admin', ['general', 'cabin'], '2026-10-27 10:12'],
    [10328, 'c5', 'DEMO05', 'so10', '2026-11-05', '08:30', 'booked', 'wecrm', ['check'], '2026-10-26 15:40'],
    [10029, 'c1', 'DEMO01', 'so10', '2026-10-30', '08:30', 'checked', 'online', ['wof'], '2026-10-20 09:02'],
    [10030, 'c3', 'DEMO03', 'so10', '2026-10-30', '10:00', 'completed', 'dealer', ['brake'], '2026-10-19 11:30'],
    [10031, 'c5', 'DEMO05', 'so10', '2026-10-29', '09:30', 'noshow', 'online', ['oil'], '2026-10-15 14:44'],
    [10032, 'c1', 'DEMO01', 'so10', '2026-10-28', '11:00', 'cancelled', 'admin', ['recall'], '2026-10-12 16:21'],
    [10033, 'c3', 'DEMO03', 'so10', '2026-10-05', '08:30', 'completed', 'online', ['general', 'oil'], '2026-09-30 08:24'],
    [20141, 'c2', 'DEMO02', 'so30', '2026-11-02', '08:00', 'booked', 'online', ['oil', 'frontbrake'], '2026-10-29 16:35'],
    [20142, 'c4', 'DEMO04', 'so30', '2026-11-04', '11:30', 'booked', 'dealer', ['general'], '2026-10-29 15:48'],
    [20143, 'c2', 'DEMO02', 'so30', '2026-10-30', '09:00', 'checked', 'admin', ['wof'], '2026-10-22 13:10'],
    [20144, 'c4', 'DEMO04', 'so30', '2026-10-30', '13:00', 'booked', 'wecrm', ['check'], '2026-10-21 10:05'],
    [20145, 'c2', 'DEMO02', 'so30', '2026-10-26', '08:30', 'completed', 'online', ['fluid'], '2026-10-14 09:55']
  ];
  var bookings = bookingRows.map(function (r, i) {
    return {
      id: 'b' + r[0], wip: r[0], customer: r[1], rego: r[2], dealer: r[3], date: r[4], time: r[5], status: r[6], source: r[7],
      items: r[8].map(function (s) { return { service: s, note: '' }; }), created: r[9], note: i === 1 ? 'Please call before starting extra work.' : '',
      mobility: '', dropOff: false, promo: 0, type: 'Service',
      conditions: { scratch: [], dent: [], mark: [] },
      log: [{ at: r[9], user: r[7] === 'online' ? 'Customer' : 'Taylor Lane', who: r[7] === 'online' ? 'customer' : 'staff', action: 'Create', what: r[7] === 'online' ? 'OSB' : 'Admin', detail: 'WIP #' + r[0] + ' created' }]
    };
  });

  // published survey responses: [dealer, customer, booking, date, answers by question id]
  var responses = [
    ['so10', 'c1', 'b10033', '2026-10-05', { q1: 'Yes', q2: 'No', q3: 'Yes', q4: 'Is a loan car available next time?' }],
    ['so10', 'c3', 'b10030', '2026-10-30', { q1: 'No', q2: 'No', q3: 'No', q4: '' }],
    ['so10', 'c5', 'b10031', '2026-10-15', { q1: 'Yes', q2: 'Yes', q3: '', q4: '' }],
    ['so10', 'c1', 'b10029', '2026-10-20', { q1: 'No', q2: 'No', q3: 'Yes', q4: 'Thanks, quick and easy.' }],
    ['so30', 'c2', 'b20145', '2026-10-26', { q1: 'Yes', q2: '', q3: 'Yes' }],
    ['so30', 'c4', 'b20142', '2026-10-29', { q1: 'No', q2: 'Yes', q3: 'No' }]
  ].map(function (r, i) { return { id: 'r' + (i + 1), dealer: r[0], customer: r[1], booking: r[2], date: r[3], answers: r[4], status: 'Active' }; });

  var users = [
    { id: 'u1', first: 'Taylor', last: 'Lane', mobile: '+64 21 555 0201', email: 'taylor.lane@example.com', address: '10 Example Quay, Auckland', type: 'Local', active: true, modified: '2026-10-30', roles: [{ role: 'Super Admin', country: '', dealers: [] }] },
    { id: 'u2', first: 'Riley', last: 'Chen', mobile: '+64 21 555 0202', email: 'riley.chen@example.com', address: '', type: 'Local', active: true, modified: '2026-10-21', roles: [{ role: 'Dealer Admin', country: 'New Zealand', dealers: ['so10'] }] },
    { id: 'u3', first: 'Jordan', last: 'Patel', mobile: '+64 21 555 0203', email: 'jordan.patel@example.com', address: '', type: 'Local', active: true, modified: '2026-10-18', roles: [{ role: 'Dealer Service Admin', country: 'New Zealand', dealers: ['so30'] }] },
    { id: 'u4', first: 'Casey', last: 'Morgan', mobile: '+64 21 555 0204', email: 'casey.morgan@example.com', address: '', type: 'Local', active: true, modified: '2026-10-02', roles: [{ role: 'NZ Admin', country: 'New Zealand', dealers: ['so10', 'so30'] }] },
    { id: 'u5', first: 'Avery', last: 'Brooks', mobile: '', email: 'avery.brooks@example.com', address: '', type: 'Local', active: false, modified: '2026-09-12', roles: [{ role: 'OSB User', country: 'New Zealand', dealers: ['so30'] }] }
  ];

  var roles = {
    system: ['BMW Admin', 'Dealer Admin', 'Region Admin', 'Super Admin'],
    custom: ['AU Admin', 'BI Admin', 'Country Admin', 'Dealer Aftersales Admin', 'Dealer Parts Admin', 'Dealer Service Admin', 'No Admin', 'NZ Admin', 'OSB Admin', 'OSB User', 'Testing']
  };
  // Module tree and actions observed on live Manage Roles (2026-10-30)
  var modules = [
    ['BI Management', ['Service Board', 'Parts Board']],
    ['OSB Management', ['Dashboard', 'Booking', 'Customer Management']],
    ['Roles & Permissions', []],
    ['User Management', ['User Management']],
    ['Dealer Management', ['Dealer', 'Package Categories', 'Dealer Capacity']],
    ['General Settings', ['Package Categories', 'Dealer Capacity', 'Company', 'Module management', 'Manage Roles']]
  ];
  // BMW Admin row values as read on live; other roles start from the same sample [ASSUMPTION].
  var bmwAdmin = {
    'BI Management': 'v', 'Service Board': 'v', 'Parts Board': 'vs', 'OSB Management': 's', 'Dashboard': 's', 'Booking': 's',
    'Customer Management': 's', 'Roles & Permissions': 'cvuds', 'User Management': 'cvuds', 'User Management/User Management': 'cvuds', 'Dealer Management': 's'
  };

  var company = {
    name: 'BMW', code: 'BMW', mobile: '[sample] 09 555 0100', enquiry: 'enquiries@example.com', privacy: 'https://www.example.com/privacy-policy',
    address: '[sample] 1 Example Road', postcode: '1023', suburb: 'Newmarket', currency: '$', decimal: 2,
    primary: '#2A53EE', secondary: '#FFFFFF', text: '#FFFFFF', shadow: '#2A53EE33', primaryFont: 'Inter', secondaryFont: 'Roboto',
    menuBg: '#101F52', submenuBg: '#000B73', inlineMenuBg: '#1D1655', menuText: '#FFFFFF'
  };

  return {
    today: today, services: services, dealers: dealers, vehicles: vehicles, makes: makes, customers: customers,
    bookings: bookings, responses: responses, users: users, roles: roles, modules: modules, bmwAdmin: bmwAdmin, company: company,
    statuses: [['booked', 'Booked In'], ['checked', 'Checked In'], ['completed', 'Completed'], ['cancelled', 'Cancelled'], ['noshow', 'No Show']],
    sources: [['online', 'Online', 'chart-online'], ['wecrm', 'WeCRM', 'chart-wecrm'], ['dealer', 'Dealer website', 'chart-dealer-website'], ['admin', 'Admin', 'chart-admin']],
    times: ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
    gst: 0.10
  };
})();
