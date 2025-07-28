import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function testAzureConnection(req: Request, res: Response) {
  try {
    console.log('[AZURE] Testing Azure CLI connection...');
    
    // Test with timeout
    const { stdout } = await execAsync('timeout 15 az account show --query "{name:name, id:id, tenantId:tenantId}" -o json', {
      timeout: 20000
    });
    
    const accountInfo = JSON.parse(stdout);
    
    res.json({
      success: true,
      message: 'Azure connection successful',
      account: accountInfo
    });
  } catch (error) {
    console.error('[AZURE] Connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Azure connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function listResourceGroups(req: Request, res: Response) {
  try {
    console.log('[AZURE] Listing resource groups...');
    
    const { stdout } = await execAsync('timeout 15 az group list --query "[].{name:name, location:location}" -o json', {
      timeout: 20000
    });
    
    const resourceGroups = JSON.parse(stdout);
    
    res.json({
      success: true,
      resourceGroups
    });
  } catch (error) {
    console.error('[AZURE] Failed to list resource groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list resource groups',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function listVMs(req: Request, res: Response) {
  try {
    const { resourceGroup } = req.query;
    
    if (!resourceGroup) {
      return res.status(400).json({
        success: false,
        message: 'Resource group is required'
      });
    }
    
    console.log(`[AZURE] Listing VMs in resource group: ${resourceGroup}`);
    
    const { stdout } = await execAsync(
      `timeout 15 az vm list -g "${resourceGroup}" --query "[].{name:name, powerState:powerState, location:location, size:hardwareProfile.vmSize}" -o json`,
      { timeout: 20000 }
    );
    
    const vms = JSON.parse(stdout);
    
    res.json({
      success: true,
      vms
    });
  } catch (error) {
    console.error('[AZURE] Failed to list VMs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list VMs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function createVM(req: Request, res: Response) {
  try {
    const { resourceGroup, vmName, vmSize, image, adminUsername } = req.body;
    
    if (!resourceGroup || !vmName || !vmSize || !image || !adminUsername) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }
    
    console.log(`[AZURE] Creating VM: ${vmName} in ${resourceGroup}`);
    
    // Create VM with basic configuration
    const createCommand = `timeout 300 az vm create \
      --resource-group "${resourceGroup}" \
      --name "${vmName}" \
      --size "${vmSize}" \
      --image "${image}" \
      --admin-username "${adminUsername}" \
      --generate-ssh-keys \
      --public-ip-sku Standard \
      --output json`;
    
    const { stdout } = await execAsync(createCommand, {
      timeout: 320000 // 5+ minutes for VM creation
    });
    
    const vmInfo = JSON.parse(stdout);
    
    res.json({
      success: true,
      message: 'VM created successfully',
      vm: vmInfo
    });
  } catch (error) {
    console.error('[AZURE] Failed to create VM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create VM',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function startVM(req: Request, res: Response) {
  try {
    const { resourceGroup, vmName } = req.body;
    
    if (!resourceGroup || !vmName) {
      return res.status(400).json({
        success: false,
        message: 'Resource group and VM name are required'
      });
    }
    
    console.log(`[AZURE] Starting VM: ${vmName}`);
    
    await execAsync(`timeout 60 az vm start --resource-group "${resourceGroup}" --name "${vmName}"`, {
      timeout: 65000
    });
    
    res.json({
      success: true,
      message: `VM ${vmName} started successfully`
    });
  } catch (error) {
    console.error('[AZURE] Failed to start VM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start VM',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function stopVM(req: Request, res: Response) {
  try {
    const { resourceGroup, vmName } = req.body;
    
    if (!resourceGroup || !vmName) {
      return res.status(400).json({
        success: false,
        message: 'Resource group and VM name are required'
      });
    }
    
    console.log(`[AZURE] Stopping VM: ${vmName}`);
    
    await execAsync(`timeout 60 az vm stop --resource-group "${resourceGroup}" --name "${vmName}"`, {
      timeout: 65000
    });
    
    res.json({
      success: true,
      message: `VM ${vmName} stopped successfully`
    });
  } catch (error) {
    console.error('[AZURE] Failed to stop VM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop VM',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}