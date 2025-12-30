// 用户初始化脚本
// 运行方式：npm run seed（需先在package.json中添加script）
// 或者：npx tsx scripts/seed-users.ts

import { prisma } from '../lib/db';
import { hashPassword } from '../lib/auth/password';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔐 Letter Box - 用户初始化脚本\n');

  // 检查是否已有用户
  const existingUsers = await prisma.authUser.findMany();
  if (existingUsers.length > 0) {
    const confirm = await question(
      '⚠️  数据库中已存在用户，是否要重置密码？(yes/no): '
    );
    if (confirm.toLowerCase() !== 'yes') {
      console.log('已取消操作');
      rl.close();
      return;
    }
    // 删除现有用户
    await prisma.authUser.deleteMany();
    console.log('✅ 已删除现有用户\n');
  }

  // 设置Admin密码
  const adminPassword = await question('请设置Admin密码（至少8位）: ');
  if (adminPassword.length < 8) {
    console.error('❌ 密码长度必须至少8位');
    rl.close();
    return;
  }

  // 设置Viewer密码
  const viewerPassword = await question('请设置Viewer密码（至少8位）: ');
  if (viewerPassword.length < 8) {
    console.error('❌ 密码长度必须至少8位');
    rl.close();
    return;
  }

  // 加密密码
  console.log('\n🔄 正在加密密码...');
  const adminHash = await hashPassword(adminPassword);
  const viewerHash = await hashPassword(viewerPassword);

  // 创建用户
  await prisma.authUser.create({
    data: {
      role: 'admin',
      passwordHash: adminHash,
    },
  });

  await prisma.authUser.create({
    data: {
      role: 'viewer',
      passwordHash: viewerHash,
    },
  });

  console.log('\n✅ 用户初始化成功！');
  console.log('   - Admin用户已创建（完全权限）');
  console.log('   - Viewer用户已创建（只读权限）\n');

  rl.close();
}

main()
  .catch((error) => {
    console.error('❌ 初始化失败:', error);
    rl.close();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
