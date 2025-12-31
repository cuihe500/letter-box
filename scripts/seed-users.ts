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
      '⚠️  数据库中已存在用户，是否要更新密码/姓名？(yes/no): '
    );
    if (confirm.toLowerCase() !== 'yes') {
      console.log('已取消操作');
      rl.close();
      return;
    }
    console.log('✅ 将更新现有用户信息（不会删除信件）\n');
  }

  // 设置姓名
  const existingAdminName =
    existingUsers.find((user) => user.role === 'admin')?.name ?? '小崔';
  const existingViewerName =
    existingUsers.find((user) => user.role === 'viewer')?.name ?? '小鹿';

  const adminNameInput = await question(`请设置Admin姓名（默认：${existingAdminName}）: `);
  const adminName = adminNameInput.trim() || existingAdminName;
  if (!adminName || adminName.length > 50) {
    console.error('❌ Admin姓名不能为空，且长度不能超过50');
    rl.close();
    return;
  }

  const viewerNameInput = await question(`请设置Viewer姓名（默认：${existingViewerName}）: `);
  const viewerName = viewerNameInput.trim() || existingViewerName;
  if (!viewerName || viewerName.length > 50) {
    console.error('❌ Viewer姓名不能为空，且长度不能超过50');
    rl.close();
    return;
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

  // 创建/更新用户
  const existingAdmin = existingUsers.find((user) => user.role === 'admin');
  const existingViewer = existingUsers.find((user) => user.role === 'viewer');

  if (existingAdmin) {
    await prisma.authUser.update({
      where: { id: existingAdmin.id },
      data: {
        name: adminName,
        passwordHash: adminHash,
      },
    });
  } else {
    await prisma.authUser.create({
      data: {
        role: 'admin',
        name: adminName,
        passwordHash: adminHash,
      },
    });
  }

  if (existingViewer) {
    await prisma.authUser.update({
      where: { id: existingViewer.id },
      data: {
        name: viewerName,
        passwordHash: viewerHash,
      },
    });
  } else {
    await prisma.authUser.create({
      data: {
        role: 'viewer',
        name: viewerName,
        passwordHash: viewerHash,
      },
    });
  }

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
