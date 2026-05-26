export class JointState2TF {
  static fromXml(opts: { xml: string }): JointState2TF;
  computeFromJointState(
    jointState: { header: unknown; name: string[]; position: number[] },
    options?: { publishTimeNs?: bigint },
  ): { transforms: unknown[] };
}
