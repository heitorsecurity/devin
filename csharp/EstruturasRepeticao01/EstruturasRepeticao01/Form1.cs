using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace EstruturasRepeticao01
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            // Qual é o valor exibido no seguinte código
            // 256, 64, 128 ou 512?
            int total = 2;
            for(int i = 0; i < 5; i += 1)
            {
                total = total * 2;
            }
            MessageBox.Show("O total é: " + total);
        }

        private void button2_Click(object sender, EventArgs e)
        {
            // Faça um programa em C# que imprima a soma dos números de 1 até 1000.
            int total = 0;
            int totalSoma = 0;
            for (int i = 0; i <= 1000; i += 1)
            {
                total = total + 1;
                totalSoma = total + totalSoma;
            }
            MessageBox.Show("Soma de 1 até 1000: " + totalSoma);
        }

        private void button3_Click(object sender, EventArgs e)
        {
            // Faça um programa em C# que imprima todos os múltiplos de 3, entre 1 e 100.
            // Para saber se um número é múltiplo de 3, você pode fazer if(numero % 3 == 0).
            int numero = 0;
            for (int i = 0; i <= 100; i += 1)
            {
                numero = numero + 1;
                if (numero % 3 == 0)
                {
                    MessageBox.Show("O número " + numero + " é múltiplo de 3");
                }
            }
        }

        private void button4_Click(object sender, EventArgs e)
        {
            // (Opcional) Escreva um programa em C# que some todos os números de 1 a 100,
            // pulando os múltiplos de 3. O programa deve imprimir o resultado final
            // em um MessageBox.
            // Qual o resultado?
            //int total = 0;
            //int totalSoma = 0;
            //for (int i = 0; i <= 100; i += 1)
        }
    }
}
