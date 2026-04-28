const adminRepository = require('./admin.repository');

const listClasses = (schoolId) => adminRepository.findClasses(schoolId);

const createClass = (schoolId, payload) => adminRepository.createClass({ ...payload, schoolId });

const listSubjects = (schoolId) => adminRepository.findSubjects(schoolId);

const createSubject = (schoolId, payload) => adminRepository.createSubject({ ...payload, schoolId });

module.exports = {
  createClass,
  createSubject,
  listClasses,
  listSubjects,
};
