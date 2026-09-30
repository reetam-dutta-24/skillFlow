import { BlockList, isIP } from "node:net";

const blocked = new BlockList();
blocked.addSubnet("0.0.0.0", 8, "ipv4");
blocked.addSubnet("10.0.0.0", 8, "ipv4");
blocked.addSubnet("127.0.0.0", 8, "ipv4");
blocked.addSubnet("169.254.0.0", 16, "ipv4");
blocked.addSubnet("172.16.0.0", 12, "ipv4");
blocked.addSubnet("192.168.0.0", 16, "ipv4");
blocked.addSubnet("224.0.0.0", 4, "ipv4");
blocked.addAddress("::", "ipv6");
blocked.addAddress("::1", "ipv6");
blocked.addSubnet("fc00::", 7, "ipv6");
blocked.addSubnet("fe80::", 10, "ipv6");
blocked.addSubnet("ff00::", 8, "ipv6");

const METADATA_HOSTS = new Set(["metadata.google.internal", "metadata.google.com"]);

/** True for loopback, private, link-local, multicast, and cloud metadata addresses. */
export function isBlockedAddress(address: string): boolean {
  const ip = address.trim().toLowerCase();
  const mapped = ip.startsWith("::ffff:") ? ip.slice("::ffff:".length) : "";
  if (mapped && isIP(mapped) === 4) return blocked.check(mapped, "ipv4");
  if (isIP(ip) === 4) return blocked.check(ip, "ipv4");
  if (isIP(ip) === 6) return blocked.check(ip, "ipv6");
  return true;
}

export function isMetadataHost(hostname: string): boolean {
  return METADATA_HOSTS.has(hostname.toLowerCase().replace(/\.$/, ""));
}
