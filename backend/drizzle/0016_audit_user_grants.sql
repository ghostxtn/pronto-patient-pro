-- Grant INSERT only to audit_user on audit_logs
GRANT INSERT ON TABLE audit_logs TO audit_user;

-- Belt-and-suspenders: revoke destructive ops from PUBLIC
REVOKE DELETE, UPDATE ON TABLE audit_logs FROM PUBLIC;
